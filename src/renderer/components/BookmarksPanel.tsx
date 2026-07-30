import type { Bookmark } from "../hooks/useBookmarks";

interface Props {
  bookmarks: Bookmark[];
  onNavigate: (url: string) => void;
  onDelete: (id: string) => void;
}

export default function BookmarksPanel({
  bookmarks,
  onNavigate,
  onDelete,
}: Props) {
  if (bookmarks.length === 0) {
    return <p className="empty-message">Keine Favoriten vorhanden</p>;
  }

  return (
    <>
      {bookmarks.map((bookmark) => (
        <div className="bookmark-item" key={bookmark.id}>
          <a
            href={bookmark.url}
            className="bookmark-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate(bookmark.url);
            }}
          >
            {bookmark.title}
          </a>
          <button className="delete-btn" onClick={() => onDelete(bookmark.id)}>
            🗑️
          </button>
        </div>
      ))}
    </>
  );
}
