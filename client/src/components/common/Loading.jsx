export default function Loading({ fullScreen = true }) {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-20'}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600" />
    </div>
  )
}
