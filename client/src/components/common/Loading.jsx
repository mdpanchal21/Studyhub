export default function Loading({ fullScreen = true }) {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-20'}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-teal-400 border-r-2 border-r-teal-300/20" />
    </div>
  )
}
