import FileCard from './FileCard'

export default function FileList({ files, currentUserId, onDelete, onPreview }) {
  if (!files.length) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-2">📂</div>
        <p className="text-sm text-stone-500">No files shared yet</p>
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      {files.map((file) => (
        <FileCard
          key={file._id}
          file={file}
          currentUserId={currentUserId}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      ))}
    </div>
  )
}
