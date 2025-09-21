import Link from 'next/link';

export default function AuthCodeError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-10 bg-white rounded-lg shadow-xl text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-700 mb-6">
          We encountered an issue authenticating your account. This may be due to an expired or invalid login link.
        </p>
        <Link href="/auth">
          <a className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Try Logging In Again
          </a>
        </Link>
      </div>
    </div>
  );
} 