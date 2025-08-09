// import { createClient } from '@supabase/supabase-js'

// // Replace these with your actual Supabase project credentials
// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co'
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key'

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// // Database helper functions
// export const db = {
//   // User operations
//   async getUser(userId) {
//     const { data, error } = await supabase
//       .from('users')
//       .select('*')
//       .eq('id', userId)
//       .single()
//     return { data, error }
//   },

//   async updateUserProfile(userId, updates) {
//     const { data, error } = await supabase
//       .from('users')
//       .update(updates)
//       .eq('id', userId)
//       .select()
//     return { data, error }
//   },

//   // Election operations
//   async getElections() {
//     const { data, error } = await supabase
//       .from('elections')
//       .select('*')
//       .order('created_at', { ascending: false })
//     return { data, error }
//   },

//   async getElection(electionId) {
//     const { data, error } = await supabase
//       .from('elections')
//       .select(`
//         *,
//         candidates (*)
//       `)
//       .eq('id', electionId)
//       .single()
//     return { data, error }
//   },

//   async createElection(election) {
//     const { data, error } = await supabase
//       .from('elections')
//       .insert(election)
//       .select()
//     return { data, error }
//   },

//   async updateElection(electionId, updates) {
//     const { data, error } = await supabase
//       .from('elections')
//       .update(updates)
//       .eq('id', electionId)
//       .select()
//     return { data, error }
//   },

//   // Candidate operations
//   async getCandidates(electionId) {
//     const { data, error } = await supabase
//       .from('candidates')
//       .select('*')
//       .eq('election_id', electionId)
//       .order('name')
//     return { data, error }
//   },

//   async addCandidate(candidate) {
//     const { data, error } = await supabase
//       .from('candidates')
//       .insert(candidate)
//       .select()
//     return { data, error }
//   },

//   // Vote operations
//   async castVote(vote) {
//     const { data, error } = await supabase
//       .from('votes')
//       .insert(vote)
//       .select()
//     return { data, error }
//   },

//   async getVoteResults(electionId) {
//     const { data, error } = await supabase
//       .from('votes')
//       .select(`
//         candidate_id,
//         candidates (name)
//       `)
//       .eq('election_id', electionId)
//     return { data, error }
//   },

//   async hasUserVoted(electionId, userId) {
//     const { data, error } = await supabase
//       .from('votes')
//       .select('id')
//       .eq('election_id', electionId)
//       .eq('user_id', userId)
//       .single()
//     return { data: !!data, error: error?.code === 'PGRST116' ? null : error }
//   }
// }
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
