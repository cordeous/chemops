/**
 * Reusable error + retry UI. Drop into any page/section that loads async data.
 *
 *   <ErrorState message={error} onRetry={load} />
 */
export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4" role="alert">
      <svg className="w-10 h-10 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 mb-1">
          {message || 'Something went wrong'}
        </p>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-outline btn-sm mt-2">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
