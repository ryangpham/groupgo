export interface Trip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  memberCount: number
}

export type CreateTripInput = Omit<Trip, 'id' | 'memberCount'>
