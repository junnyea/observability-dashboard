import { useRef, useEffect } from 'react'
import LogEntry from './LogEntry'

export default function LogViewer({ logs, autoScroll = true }) {
  const containerRef = useRef(null)
  const shouldScrollRef = useRef(true)

  useEffect(() => {
    if (autoScroll && shouldScrollRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    // If user scrolls up, disable auto-scroll; if at bottom, enable it
    shouldScrollRef.current = scrollHeight - scrollTop - clientHeight < 50
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="log-viewer h-[600px] overflow-y-auto bg-gray-900 rounded-lg p-4 font-mono text-sm"
    >
      {logs.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          Waiting for logs...
        </div>
      ) : (
        logs.map((log, idx) => (
          <LogEntry key={`${log.timestamp}-${idx}`} log={log} />
        ))
      )}
    </div>
  )
}
