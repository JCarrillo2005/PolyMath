interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  message = "Cargando...",
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6 border-2",
    md: "h-10 w-10 border-3",
    lg: "h-14 w-14 border-4",
  };

  return (
    <div className="flex flex-col justify-center items-center py-16">
      <div className="relative">
        <div
          className={`animate-spin rounded-full ${sizeClasses[size]} border-gray-200 border-t-blue-600`}
        />
      </div>
      {message && <p className="text-gray-500 mt-4 text-sm">{message}</p>}
    </div>
  );
}
