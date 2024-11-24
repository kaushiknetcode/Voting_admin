import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io } from 'socket.io-client';
import { VotingData, Place, ActivityLog, VotingDate } from '../types';
import { API_URL } from '../config';

const socket = io(API_URL, {
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

interface VotingState {
  places: Place[];
  votingData: VotingData[];
  activityLogs: ActivityLog[];
  votingDates: VotingDate[];
  currentDate: string | null;
  addVotingData: (data: Omit<VotingData, 'timestamp'>) => void;
  getPlaceData: (placeId: number, date?: string) => VotingData[];
  getZonalData: (date?: string) => {
    totalVotes: number;
    totalMale: number;
    totalFemale: number;
    votingPercentage: number;
  };
  getCumulativeVotes: (upToDate?: string) => {
    byPlace: Record<number, number>;
    total: number;
  };
  setDateActive: (date: string, isActive: boolean) => void;
  setDateComplete: (date: string, isComplete: boolean) => void;
  setCurrentDate: (date: string | null) => void;
  reset: () => void;
}

const PLACES: Place[] = [
  { id: 1, name: 'Headquarter', totalVoters: 3296 },
  { id: 2, name: 'Malda Division', totalVoters: 9962 },
  { id: 3, name: 'Howrah Division', totalVoters: 25224 },
  { id: 4, name: 'Sealdah Division', totalVoters: 21038 },
  { id: 5, name: 'Liluah Workshop', totalVoters: 6709 },
  { id: 6, name: 'Kanchrapara Workshop', totalVoters: 7346 },
  { id: 7, name: 'Jamalpur Workshop', totalVoters: 6909 },
  { id: 8, name: 'Asansol Division', totalVoters: 17257 },
];

const INITIAL_VOTING_DATES: VotingDate[] = [
  { date: '2024-12-04', isActive: true, isComplete: false },
  { date: '2024-12-05', isActive: false, isComplete: false },
  { date: '2024-12-06', isActive: false, isComplete: false },
  { date: '2024-12-10', isActive: false, isComplete: false },
];

export const useVotingStore = create<VotingState>()(
  persist(
    (set, get) => {
      // Connect to socket room
      socket.emit('joinRoom', 'votingRoom');

      // Listen for updates from other clients
      socket.on('votingUpdate', (data) => {
        set(data);
      });

      return {
        places: PLACES,
        votingData: [],
        activityLogs: [],
        votingDates: INITIAL_VOTING_DATES,
        currentDate: '2024-12-04',

        addVotingData: (data) => {
          const timestamp = Date.now();
          const newLog: ActivityLog = {
            id: timestamp.toString(),
            timestamp,
            placeName: PLACES.find(p => p.id === data.placeId)?.name || '',
            role: data.submittedBy.role,
            votesCount: data.votesCount,
            maleVoters: data.maleVoters,
            femaleVoters: data.femaleVoters,
            date: data.date,
          };

          const newState = {
            votingData: [...get().votingData, { ...data, timestamp }],
            activityLogs: [newLog, ...get().activityLogs],
          };

          set(newState);
          socket.emit('votingUpdate', newState);
        },

        getPlaceData: (placeId, date) => {
          const data = get().votingData;
          return data.filter(d => 
            d.placeId === placeId && 
            (!date || d.date === date)
          );
        },

        getZonalData: (date) => {
          const data = get().votingData.filter(d => !date || d.date === date);
          const totalVoters = PLACES.reduce((sum, p) => sum + p.totalVoters, 0);
          
          const totals = data.reduce((acc, d) => ({
            totalVotes: acc.totalVotes + d.votesCount,
            totalMale: acc.totalMale + d.maleVoters,
            totalFemale: acc.totalFemale + d.femaleVoters,
          }), { totalVotes: 0, totalMale: 0, totalFemale: 0 });

          return {
            ...totals,
            votingPercentage: (totals.totalVotes / totalVoters) * 100,
          };
        },

        getCumulativeVotes: (upToDate) => {
          const data = get().votingData.filter(d => 
            !upToDate || d.date <= upToDate
          );

          const byPlace = data.reduce((acc, d) => {
            acc[d.placeId] = (acc[d.placeId] || 0) + d.votesCount;
            return acc;
          }, {} as Record<number, number>);

          return {
            byPlace,
            total: Object.values(byPlace).reduce((sum, v) => sum + v, 0),
          };
        },

        setDateActive: (date, isActive) => {
          const newDates = get().votingDates.map(d => ({
            ...d,
            isActive: d.date === date ? isActive : isActive ? false : d.isActive,
          }));
          set({ votingDates: newDates });
          socket.emit('votingUpdate', { votingDates: newDates });
        },

        setDateComplete: (date, isComplete) => {
          const newDates = get().votingDates.map(d => ({
            ...d,
            isComplete: d.date === date ? isComplete : d.isComplete,
          }));
          set({ votingDates: newDates });
          socket.emit('votingUpdate', { votingDates: newDates });
        },

        setCurrentDate: (date) => {
          set({ currentDate: date });
        },

        reset: () => {
          const newState = {
            votingData: [],
            activityLogs: [],
            votingDates: INITIAL_VOTING_DATES,
            currentDate: '2024-12-04'
          };
          set(newState);
          socket.emit('votingUpdate', newState);
        },
      };
    },
    {
      name: 'voting-storage',
      partialize: (state) => ({
        votingData: state.votingData,
        activityLogs: state.activityLogs,
        votingDates: state.votingDates,
        currentDate: state.currentDate,
      }),
    }
  )
);