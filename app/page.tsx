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
  is_favorite: boolean
}

export default function Dashboard() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [userName, setUserName] = useState<string>('')
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

      // Set user name from Google OAuth
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')

      // B. Fetch Initial Bookmarks
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('created_at', { ascending: false })

      if (data) setBookmarks(data)
      setLoading(false)

      // C. REALTIME LISTENER
      channel = supabase
        .channel('realtime bookmarks')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setBookmarks((current) => [payload.new as Bookmark, ...current])
            } else if (payload.eventType === 'DELETE') {
              setBookmarks((current) => current.filter((item) => item.id !== payload.old.id))
            }
            if (payload.eventType === 'INSERT') {
              setBookmarks((current) => [payload.new as Bookmark, ...current])
            } else if (payload.eventType === 'DELETE') {
              setBookmarks((current) => current.filter((item) => item.id !== payload.old.id))
            } else if (payload.eventType === 'UPDATE') { // Add this block
              setBookmarks((current) => 
                current.map((item) => item.id === payload.new.id ? (payload.new as Bookmark) : item)
                  .sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite)) // Keep favorites at top
              )
            }
          }
        )
        .subscribe()
    }

    setupDashboard()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, router])

  // 3. Add a Bookmark
  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newUrl) return

    setIsAdding(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase.from('bookmarks').insert({
        title: newTitle,
        url: newUrl,
        user_id: user.id
      }).select()

      if (error) {
        console.error('Error adding:', error)
        alert(error.message)
      } else {
        setNewTitle('')
        setNewUrl('')
      }
    }
    setIsAdding(false)
  }

  // 4. Delete a Bookmark
  const deleteBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id)
  }
  
  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('bookmarks')
      .update({ is_favorite: !currentStatus })
      .eq('id', id)

    if (error) {
      console.error('Favorite update failed:', error.message)
    }
  }


  // 5. Sign Out
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse"></div>
            <div className="w-3 h-3 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Decorative liquid blobs */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl liquid-blob pointer-events-none"></div>
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl liquid-blob pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 fade-in-up">
          <div>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400" 
                style={{ fontFamily: "'Crimson Pro', serif" }}>
              Bookmarks
            </h1>
            <p className="text-gray-400 mt-2 text-sm tracking-wide">
              Hi <span className="text-purple-400 font-medium">{userName}</span> 
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="glass glass-hover px-6 py-3 rounded-2xl text-sm font-medium text-gray-300 transition-all group"
          >
            <span className="flex items-center gap-2">
              <span>Sign Out</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
          </button>
        </div>

        {/* Add Bookmark Form */}
        <div className="glass rounded-3xl p-8 mb-12 fade-in-up stagger-1">
          <form onSubmit={addBookmark} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <input
                type="text"
                placeholder="Bookmark title"
                className="w-full glass glass-hover rounded-2xl px-6 py-4 text-gray-200 placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-400/50 transition-all"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10 blur-xl"></div>
            </div>
            <div className="flex-1 relative group">
              <input
                type="url"
                placeholder="https://example.com"
                className="w-full glass glass-hover rounded-2xl px-6 py-4 text-gray-200 placeholder-gray-500 outline-none focus:ring-2 focus:ring-pink-400/50 transition-all"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 to-cyan-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity -z-10 blur-xl"></div>
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="glass glass-hover rounded-2xl px-8 py-4 font-medium bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                {isAdding ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </>
                )}
              </span>
            </button>
          </form>
        </div>

        {/* Bookmarks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark, index) => (
            <div
              key={bookmark.id}
              className={`glass glass-hover rounded-2xl p-6 group relative overflow-hidden scale-in stagger-${Math.min(index % 5 + 1, 5)}`}
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              
              <div className="relative">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 mt-4">
                    {/* The Star Icon */}
                    <button
                      onClick={() => toggleFavorite(bookmark.id, bookmark.is_favorite)}
                      className={`transition-colors flex-shrink-0 ${bookmark.is_favorite ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-500'}`}
                    >
                      <svg className="w-5 h-5" fill={bookmark.is_favorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </div>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 group/link"
                  >
                    <h3 className="text-lg font-medium text-gray-200 group-hover/link:text-purple-400 transition-colors line-clamp-2">
                      {bookmark.title}
                    </h3>
                  </a>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-500/20 transition-all text-gray-400 hover:text-red-400"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-cyan-400 transition-colors truncate block group/url"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="truncate">{new URL(bookmark.url).hostname}</span>
                  </span>
                </a>
                
                <p className="text-xs text-gray-600 mt-4">
                  {new Date(bookmark.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          ))}

          {bookmarks.length === 0 && (
            <div className="col-span-full glass rounded-3xl p-16 text-center fade-in-up stagger-2">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-xl font-light text-gray-400 mb-2">No bookmarks yet</h3>
              <p className="text-gray-600 text-sm">Add your first bookmark above to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}