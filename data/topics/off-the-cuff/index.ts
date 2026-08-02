export * from './artificial-intelligence'
export * from './computer-science'
export * from './economics'
export * from './history'
export * from './philosophy'
export * from './psychology'
export * from './science'
export * from './general'

import { ArtificialIntelligenceTopics, ComputerScienceTopics, EconomicsTopics, HistoryTopics, PhilosophyTopics, PsychologyTopics, ScienceTopics, GeneralTopics } from '.'

export const offTheCuffTopics = [
  ...ArtificialIntelligenceTopics,
  ...ComputerScienceTopics,
  ...EconomicsTopics,
  ...HistoryTopics,
  ...PhilosophyTopics,
  ...PsychologyTopics,
  ...ScienceTopics,
  ...GeneralTopics
]
