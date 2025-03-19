import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const GoalsList = ({ goals, onDelete }) => {
  if (!goals || goals.length === 0) {
    return <p className="text-gray-500">No goals found.</p>;
  }

  return (
    <div className="space-y-4">
      {goals.map(goal => (
        <div 
          key={goal._id} 
          className="goal-card"
        >
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    goal.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {goal.goalType.replace(/-/g, ' ')}
                  </span>
                  
                  {goal.status === 'completed' && (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Completed
                    </span>
                  )}
                </div>
                
                <h3 className="text-md font-semibold">
                  {goal.goalType.replace(/-/g, ' ')}: {goal.currentValue} → {goal.targetValue}
                </h3>
              </div>
              
              <div className="flex space-x-1">
                <Link
                  to={`/user/goals/${goal._id}`}
                  className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                  title="View Goal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </Link>

                <Link
                  to={`/user/goals/edit/${goal._id}`}
                  className="p-1.5 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100"
                  title="Edit Goal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </Link>

                <Link
                  to={`/user/goals/progress/${goal._id}`}
                  className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                  title="Update Progress"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </Link>

                <button
                  onClick={() => onDelete(goal._id)}
                  className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                  title="Delete Goal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="mb-3 mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    width: `${goal.progress}%`,
                    backgroundColor: getProgressColor(goal.progress)
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{Math.round(goal.progress)}% complete</span>
                <span>Deadline: {format(new Date(goal.deadline), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper function to get color based on progress
const getProgressColor = (progress) => {
  if (progress < 25) return '#f5222d'; // Red
  if (progress < 50) return '#fa8c16'; // Orange
  if (progress < 75) return '#fadb14'; // Yellow
  return '#52c41a'; // Green
};

export default GoalsList; 