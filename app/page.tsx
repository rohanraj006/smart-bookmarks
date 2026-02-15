'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Define what a Bookmark looks like
type Bookmark = {
  id: string
  title: string
  url: string
  created_at: string
  user_id: string
}

export default function Dashboard() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // 1. Load data & Set up Realtime
  useEffect(() => {
    let channel: any;

    const setupDashboard = async () => {
      // A. Check User
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // B. Fetch Initial Bookmarks
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setBookmarks(data)
      setLoading(false)

      // C. REALTIME LISTENER (The Fix)
      // We set up the listener HERE, so we can clean it up later
      channel = supabase
        .channel('realtime bookmarks')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`, // <--- The Filter that fixes "Add"
          },
          (payload) => {
            console.log('Realtime Event Received:', payload) 

            if (payload.eventType === 'INSERT') {
              setBookmarks((current) => [payload.new as Bookmark, ...current])
            } else if (payload.eventType === 'DELETE') {
              setBookmarks((current) => current.filter((item) => item.id !== payload.old.id))
            }
          }
        )
        .subscribe()
    }

    setupDashboard()

    // Cleanup when closing the page
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, router])

  // 3. Add a Bookmark
  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newUrl) return

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // We use .select() to ensure the database returns the new row
      const { error } = await supabase.from('bookmarks').insert({
        title: newTitle,
        url: newUrl,
        user_id: user.id
      }).select()

      if (error) {
        console.error('Error adding:', error)
        alert(error.message)
      } else {
        // Success! Clear form
        setNewTitle('')
        setNewUrl('')
      }
    }
  }

  // 4. Delete a Bookmark
  const deleteBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id)
  }

  // 5. Sign Out
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="p-10">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Smart Bookmarks</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md"
          >
            Sign Out
          </button>
        </div>

        {/* Add Bookmark Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <form onSubmit={addBookmark} className="flex gap-4">
            <input
              type="text"
              placeholder="Bookmark Title (e.g. Google)"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-black"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-black"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Add
            </button>
          </form>
        </div>

        {/* Bookmarks List */}
        <div className="grid gap-4">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center group"
            >
              <div>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {bookmark.title}
                </a>
                <p className="text-sm text-gray-500">{bookmark.url}</p>
              </div>
              <button
                onClick={() => deleteBookmark(bookmark.id)}
                className="opacity-0 group-hover:opacity-100 px-3 py-1 text-sm text-red-500 hover:text-red-700 transition-opacity"
              >
                Delete
              </button>
            </div>
          ))}

          {bookmarks.length === 0 && (
            <div className="text-center text-gray-400 py-10">
              No bookmarks yet. Add one above!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}