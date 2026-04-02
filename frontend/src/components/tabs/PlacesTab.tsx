import { Compass, Map, MapPinned } from 'lucide-react'
import { TabSection } from './TabSection'

export default function PlacesTab() {
  return (
    <TabSection
      eyebrow="Places"
      title="Collect stops worth sharing"
      description="This area is ready for saved restaurants, landmarks, neighborhoods, and map-driven planning once those APIs are added."
    >
      <div className="trip-placeholder-grid">
        <article className="trip-placeholder-card">
          <MapPinned size={18} />
          <h3>Saved stops</h3>
          <p>Pin restaurants, hotels, and attractions your group wants to compare.</p>
        </article>
        <article className="trip-placeholder-card">
          <Map size={18} />
          <h3>Map context</h3>
          <p>Future map views can anchor everything geographically without changing the shell.</p>
        </article>
        <article className="trip-placeholder-card">
          <Compass size={18} />
          <h3>Discovery</h3>
          <p>Search and recommendation flows can drop into this tab when ready.</p>
        </article>
      </div>
    </TabSection>
  )
}
