import json
import os
import ssl
from typing import Any, cast
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import certifi
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError

from app.database import execute_returning, fetch_all, fetch_one
from app.schemas.places import PlaceCreate, PlaceUpdate
from app.security import get_current_user

router = APIRouter(tags=["places"])
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
GOOGLE_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete"


def raise_place_not_found():
    raise HTTPException(status_code=404, detail="Place not found")


def raise_trip_not_found():
    raise HTTPException(status_code=404, detail="Trip not found")


def handle_integrity_error(exc: IntegrityError):
    raise HTTPException(status_code=400, detail="Request violates database constraints") from exc


def raise_google_places_not_configured():
    raise HTTPException(status_code=503, detail="Google Places API is not configured")


def fetch_google_json(
    url: str,
    *,
    method: str = "GET",
    body: dict[str, Any] | None = None,
    field_mask: str | None = None,
):
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    headers = {
        "X-Goog-Api-Key": cast(str, GOOGLE_PLACES_API_KEY),
    }
    if field_mask:
        headers["X-Goog-FieldMask"] = field_mask

    encoded_body = None
    if body is not None:
        encoded_body = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = Request(url, data=encoded_body, headers=headers, method=method)

    try:
        with urlopen(request, timeout=8, context=ssl_context) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        try:
            error_payload = json.loads(exc.read().decode("utf-8"))
            detail = error_payload.get("error", {}).get("message") or "Google Places request failed"
        except Exception:
            detail = "Google Places request failed"
        raise HTTPException(status_code=502, detail=detail) from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail="Unable to reach Google Places") from exc

    return payload


def ensure_trip_access(trip_id: int, current_user: dict[str, Any]):
    trip = fetch_one(
        """
        SELECT trip_id, owner_user_id
        FROM trips
        WHERE trip_id = :trip_id
        """,
        {"trip_id": trip_id},
    )
    if trip is None:
        raise_trip_not_found()

    trip_row = cast(dict[str, Any], trip)

    if trip_row["owner_user_id"] == current_user["user_id"]:
        return

    membership = fetch_one(
        """
        SELECT user_id
        FROM memberships
        WHERE trip_id = :trip_id AND user_id = :user_id
        """,
        {"trip_id": trip_id, "user_id": current_user["user_id"]},
    )
    if membership is None:
        raise HTTPException(status_code=403, detail="You do not have access to this trip")


def get_place_row(place_id: int):
    place = fetch_one(
        """
        SELECT place_id, trip_id, place_name, address, rating, place_type
        FROM places
        WHERE place_id = :place_id
        """,
        {"place_id": place_id},
    )
    if place is None:
        raise_place_not_found()
    return cast(dict[str, Any], place)


def get_trip_search_context(trip_id: int):
    trip = fetch_one(
        """
        SELECT trip_id, destination_text, destination_lat, destination_lng
        FROM trips
        WHERE trip_id = :trip_id
        """,
        {"trip_id": trip_id},
    )
    if trip is None:
        raise_trip_not_found()
    return cast(dict[str, Any], trip)


@router.get("/trips/{trip_id}/places/search")
def search_google_places(trip_id: int, q: str, current_user: dict = Depends(get_current_user)):
    ensure_trip_access(trip_id, current_user)
    trip = get_trip_search_context(trip_id)

    query = q.strip()
    if len(query) < 2:
        return []

    if not GOOGLE_PLACES_API_KEY:
        raise_google_places_not_configured()

    autocomplete_input = query
    autocomplete_body: dict[str, Any] = {
        "input": autocomplete_input,
        "includedPrimaryTypes": ["restaurant", "tourist_attraction", "lodging"],
    }

    destination_lat = trip.get("destination_lat")
    destination_lng = trip.get("destination_lng")
    destination_text = trip.get("destination_text")

    if destination_lat is not None and destination_lng is not None:
        autocomplete_body["locationBias"] = {
            "circle": {
                "center": {
                    "latitude": float(destination_lat),
                    "longitude": float(destination_lng),
                },
                "radius": 50000.0,
            }
        }
    elif isinstance(destination_text, str) and destination_text.strip():
        autocomplete_body["input"] = f"{query} near {destination_text.strip()}"

    autocomplete_payload = fetch_google_json(
        GOOGLE_AUTOCOMPLETE_URL,
        method="POST",
        body=autocomplete_body,
        field_mask="suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
    )

    predictions = autocomplete_payload.get("suggestions") or []
    results: list[dict[str, Any]] = []

    for prediction in predictions[:5]:
        place_prediction = prediction.get("placePrediction") or {}
        google_place_id = place_prediction.get("placeId")
        if not isinstance(google_place_id, str) or not google_place_id:
            continue

        prediction_text = (place_prediction.get("text") or {}).get("text")
        structured_formatting = place_prediction.get("structuredFormat") or {}
        main_text = (structured_formatting.get("mainText") or {}).get("text")
        secondary_text = (structured_formatting.get("secondaryText") or {}).get("text")

        results.append(
            {
                "google_place_id": google_place_id,
                "place_name": main_text if isinstance(main_text, str) and main_text else prediction_text or "Untitled place",
                "address": secondary_text if isinstance(secondary_text, str) else "",
                "rating": None,
                "place_type": None,
            }
        )

    return results


@router.get("/trips/{trip_id}/places")
def list_trip_places(trip_id: int, current_user: dict = Depends(get_current_user)):
    ensure_trip_access(trip_id, current_user)
    return fetch_all(
        """
        SELECT place_id, trip_id, place_name, address, rating, place_type
        FROM places
        WHERE trip_id = :trip_id
        ORDER BY place_name, place_id
        """,
        {"trip_id": trip_id},
    )


@router.get("/places/{place_id}")
def get_place(place_id: int, current_user: dict = Depends(get_current_user)):
    place = get_place_row(place_id)
    ensure_trip_access(place["trip_id"], current_user)
    return place


@router.post("/places", status_code=201)
def create_place(place: PlaceCreate, current_user: dict = Depends(get_current_user)):
    ensure_trip_access(place.trip_id, current_user)

    try:
        return execute_returning(
            """
            INSERT INTO places (trip_id, place_name, address, rating, place_type)
            VALUES (:trip_id, :place_name, :address, :rating, :place_type)
            RETURNING place_id, trip_id, place_name, address, rating, place_type
            """,
            place.model_dump(),
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)


@router.put("/places/{place_id}")
def update_place(place_id: int, place: PlaceUpdate, current_user: dict = Depends(get_current_user)):
    existing_place = get_place_row(place_id)
    ensure_trip_access(existing_place["trip_id"], current_user)

    updates = place.model_dump(exclude_unset=True)
    updated_values = {**existing_place, **updates, "place_id": place_id}

    ensure_trip_access(updated_values["trip_id"], current_user)

    try:
        return execute_returning(
            """
            UPDATE places
            SET trip_id = :trip_id,
                place_name = :place_name,
                address = :address,
                rating = :rating,
                place_type = :place_type
            WHERE place_id = :place_id
            RETURNING place_id, trip_id, place_name, address, rating, place_type
            """,
            updated_values,
        )
    except IntegrityError as exc:
        handle_integrity_error(exc)


@router.delete("/places/{place_id}")
def delete_place(place_id: int, current_user: dict = Depends(get_current_user)):
    existing_place = get_place_row(place_id)
    ensure_trip_access(existing_place["trip_id"], current_user)

    execute_returning(
        """
        UPDATE reservations
        SET place_id = NULL
        WHERE place_id = :place_id
        RETURNING reservation_id
        """,
        {"place_id": place_id},
    )

    deleted_place = execute_returning(
        """
        DELETE FROM places
        WHERE place_id = :place_id
        RETURNING place_id, trip_id, place_name, address, rating, place_type
        """,
        {"place_id": place_id},
    )
    if deleted_place is None:
        raise_place_not_found()
    return deleted_place
