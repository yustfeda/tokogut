
import React, { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../../services/firebase';
import { LeaderboardEntry } from '../../types';
import { Spinner } from '../../components/Spinner';
import { IconTrophy } from '../../constants';

const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const leaderboardRef = ref(db, 'mysteryBoxLeaderboard');
    const listener = onValue(leaderboardRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Aggregate wins by user email
        const userWins: { [email: string]: { email: string, winCount: number, lastWin: LeaderboardEntry } } = {};
        Object.keys(data).forEach(key => {
            const entry = { id: key, ...data[key] };
            if (!userWins[entry.email] || userWins[entry.email].lastWin.timestamp < entry.timestamp) {
                userWins[entry.email] = {
                    email: entry.email,
                    winCount: 0,
                    lastWin: entry
                };
            }
        });

        Object.keys(data).forEach(key => {
            const entry = data[key];
            if(userWins[entry.email]) {
                userWins[entry.email].winCount += 1;
            }
        });

        const aggregatedData = Object.values(userWins)
            .map(uw => ({
                id: uw.lastWin.id,
                email: uw.email,
                itemWon: uw.lastWin.itemWon,
                timestamp: uw.lastWin.timestamp,
                winCount: uw.winCount,
            }))
            .sort((a, b) => b.winCount - a.winCount || b.timestamp - a.timestamp);

        setLeaderboard(aggregatedData);
      } else {
        setLeaderboard([]);
      }
      setLoading(false);
    });

    return () => off(leaderboardRef, 'value', listener);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg">
      <div className="flex items-center justify-center mb-6">
        <IconTrophy />
        <h1 className="text-3xl font-bold ml-2">Mystery Box Leaderboard</h1>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Item Won</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Wins</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-lg font-bold">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{entry.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{entry.itemWon}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(entry.timestamp).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">{entry.winCount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No winners yet. Be the first!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
