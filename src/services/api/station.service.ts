import { Station } from '@/types/station.types'
import { fetchStations } from './backend-api.service'

export const stationService = {
  getAllStations: async (): Promise<Station[]> => {
    return fetchStations()
  },
  getStationById: async (id: string): Promise<Station | null> => {
    const stations = await fetchStations()
    const station = stations.find((s) => s.id === id)
    return station ?? null
  },
  getStationsByType: async (
    type: 'praesidium' | 'revier'
  ): Promise<Station[]> => {
    const stations = await fetchStations()
    return stations.filter((s) => s.type === type)
  },
  getReviereByPraesidium: async (praesidiumId: string): Promise<Station[]> => {
    const stations = await fetchStations()
    return stations.filter((s) => s.parentId === praesidiumId)
  },
}
