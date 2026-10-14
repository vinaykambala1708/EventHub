import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Bot,
  Camera,
  CameraOff,
  CalendarDays,
  Eye,
  EyeOff,
  MapPin,
  MessageCircle,
  Moon,
  Send,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'
import {
  approveEvent,
  cancelRegistration,
  checkInRegistration,
  createEvent,
  updateEvent,
  deleteAdminEvent,
  deleteEvent,
  deleteUser,
  promoteUserToOrganizer,
  fetchAdminEvents,
  fetchAdminUsers,
  fetchAdminRegistrations,
  fetchCurrentUserProfile,
  fetchEventRegistrations,
  fetchMyRegistrations,
  fetchOrganizerEvents,
  fetchPublicEvents,
  loginUser,
  registerUser,
  registerForEvent,
  rejectEvent,
} from './api'
import './App.css'

const emptyEventForm = {
  title: '',
  description: '',
  imageUrl: '',
  category: 'Technical',
  date: '',
  time: '',
  venue: '',
  seats: '100',
  ticketTypes: [{ name: 'General Admission', price: '0', capacity: '100' }],
}

const authDefaults = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  agreedToTerms: false,
}

const featureHighlights = [
  {
    title: 'Smart discovery',
    description: 'Browse trending events by category, date, and venue in seconds.',
  },
  {
    title: 'Fast bookings',
    description: 'Reserve seats instantly and receive a digital pass for check-in.',
  },
  {
    title: 'Organizer control',
    description: 'Approve events, manage attendance, and keep your community organized.',
  },
]

const tokenStorageKey = 'eventflow-auth-token'
const themeStorageKey = 'eventflow-theme'
const today = new Date().toISOString().slice(0, 10)
const dashboardPath = (role) => ({
  ADMIN: '/admin/dashboard',
  ORGANIZER: '/organizer/dashboard',
  USER: '/user/dashboard',
}[role] || '/login')

const viewForPath = (pathname) => {
  if (pathname === '/' || pathname === '/login' || pathname === '/register') return 'home'
  if (pathname === '/events' || /^\/events\/\d+$/.test(pathname)) return 'events'
  if (pathname.startsWith('/organizer/events/create') || pathname.startsWith('/organizer/events/edit/')) return 'create'
  if (pathname.startsWith('/organizer/events')) return 'checkin'
  if (/^\/(user|organizer|admin)\//.test(pathname)) return 'dashboard'
  return 'home'
}

const loadStoredTheme = () => {
  const storedTheme = window.localStorage.getItem(themeStorageKey)
  return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark'
}

const categoryImages = {
  technology: '/images/events/photos/tech-career-summit.jpg',
  business: '/images/events/photos/creative-business-expo.jpg',
  health: '/images/events/photos/city-marathon-2026.jpg',
  finance: '/images/events/photos/startup-pitch-night.jpg',
  entertainment: '/images/events/photos/sunset-music-festival.jpg',
  food: '/images/events/photos/community-food-fair.jpg',
  culture: '/images/events/photos/cultural-heritage-night.jpg',
  education: '/images/events/photos/digital-skills-for-everyone.jpg',
}

const seededEventImages = {
  'Tech Career Summit': '/images/events/photos/tech-career-summit.jpg',
  'Creative Business Expo': '/images/events/photos/creative-business-expo.jpg',
  'City Marathon 2026': '/images/events/photos/city-marathon-2026.jpg',
  'Startup Pitch Night': '/images/events/photos/startup-pitch-night.jpg',
  'Sunset Music Festival': '/images/events/photos/sunset-music-festival.jpg',
  'Design for Impact Workshop': '/images/events/photos/design-for-impact-workshop.jpg',
  'Community Food Fair': '/images/events/photos/community-food-fair.jpg',
  'Cultural Heritage Night': '/images/events/photos/cultural-heritage-night.jpg',
  'Hyderabad Future of AI Forum': '/images/events/photos/nairobi-future-of-ai-forum.jpg',
  'Women in Business Breakfast': '/images/events/photos/women-in-business-breakfast.jpg',
  'Hussain Sagar Yoga & Wellness': '/images/events/photos/coastline-yoga-wellness.jpg',
  'Hyderabad Indie Music Night': '/images/events/photos/east-africa-indie-music-night.jpg',
  'Telangana Flavours Food Festival': '/images/events/photos/flavours-of-kenya-food-festival.jpg',
  'African Stories Film Showcase': '/images/events/photos/african-stories-film-showcase.jpg',
  'Build Your First Mobile App': '/images/events/photos/build-your-first-mobile-app.jpg',
  'Hyderabad Trail Run': '/images/events/photos/great-rift-valley-trail-run.jpg',
  'AI & Automation Expo': '/images/events/photos/ai-automation-expo.jpg',
  'Women in Leadership Forum': '/images/events/photos/women-in-leadership-forum.jpg',
  'Hyderabad Night Run': '/images/events/photos/nairobi-night-run.jpg',
  'Creator Studio Lab': '/images/events/photos/creator-studio-lab.jpg',
  'Taste of Hyderabad': '/images/events/photos/taste-of-mombasa.jpg',
  'Hyderabad Design Week': '/images/events/photos/nairobi-design-week.jpg',
  "Founders' Funding Clinic": '/images/events/photos/founders-funding-clinic.jpg',
  'Lake Victoria Birding & Nature Walk':
    '/images/events/photos/lake-victoria-birding-nature-walk.jpg',
  'Telangana Coffee & Chocolate Festival':
    '/images/events/photos/kenyan-coffee-chocolate-festival.jpg',
  'Digital Skills for Everyone': '/images/events/photos/digital-skills-for-everyone.jpg',
  'Hyderabad Dandiya Raas Night': '/images/events/photos/sunset-music-festival.jpg',
  'Deccan Beats: Live Music Evening': '/images/events/photos/east-africa-indie-music-night.jpg',
  'Hyderabad AI, Cloud and Cybersecurity Summit': '/images/events/photos/tech-career-summit.jpg',
  'CodeSprint Hyderabad: 24-Hour Hackathon': '/images/events/photos/build-your-first-mobile-app.jpg',
  'Telangana Food and Culture Festival': '/images/events/photos/community-food-fair.jpg',
  'Robotics, Drones and IoT Innovation Expo': '/images/events/photos/ai-automation-expo.jpg',
  'Hyderabad Startup Pitch and Networking Night': '/images/events/photos/startup-pitch-night.jpg',
  'Tollywood Melodies: Orchestra Night': '/images/events/photos/cultural-heritage-night.jpg',
  'Charminar Heritage Photography Walk': '/images/events/photos/city-marathon-2026.jpg',
  'Hyderabad Women in Technology Meetup': '/images/events/photos/women-in-business-breakfast.jpg',
}

const frontendPreviewEvents = [
  {
    id: 'preview-01',
    title: 'Deccan Beats: Live Music Evening',
    description: 'Telugu favorites, indie pop, and acoustic fusion performed by Hyderabad artists.',
    category: 'Music',
    date: '16 Jan 2027',
    time: '7:00 PM',
    venue: 'Shilpakala Vedika, Madhapur, Hyderabad',
    seats: 1200,
    ticketTypes: [],
    status: 'Approved',
    image: '/images/events/photos/east-africa-indie-music-night.jpg',
    previewOnly: true,
  },
  {
    id: 'preview-02',
    title: 'Hyderabad AI, Cloud and Cybersecurity Summit',
    description: 'Practical technology talks, product demos, and networking for students and IT professionals.',
    category: 'Technology',
    date: '30 Jan 2027',
    time: '9:00 AM',
    venue: 'HITEX Exhibition Centre, Madhapur, Hyderabad',
    seats: 700,
    ticketTypes: [],
    status: 'Approved',
    image: '/images/events/photos/tech-career-summit.jpg',
    previewOnly: true,
  },
  {
    id: 'preview-03',
    title: 'CodeSprint Hyderabad: 24-Hour Hackathon',
    description: 'Build a prototype with a team, meet mentors, and present it at the final showcase.',
    category: 'Hackathon',
    date: '20 Feb 2027',
    time: '9:00 AM',
    venue: 'T-Hub, Raidurg, Hyderabad',
    seats: 250,
    ticketTypes: [],
    status: 'Approved',
    image: '/images/events/photos/build-your-first-mobile-app.jpg',
    previewOnly: true,
  },
  {
    id: 'preview-04',
    title: 'Telangana Food and Culture Festival',
    description: 'Regional food, artisan stalls, folk performances, and family activities.',
    category: 'Food and Culture',
    date: '27 Feb 2027',
    time: '11:00 AM',
    venue: "People's Plaza, Necklace Road, Hyderabad",
    seats: 1500,
    ticketTypes: [],
    status: 'Approved',
    image: '/images/events/photos/community-food-fair.jpg',
    previewOnly: true,
  },
  {
    id: 'preview-05',
    title: 'Robotics, Drones and IoT Innovation Expo',
    description: 'Explore robot, drone, and connected-device demonstrations from students and startups.',
    category: 'Technology',
    date: '13 Mar 2027',
    time: '10:00 AM',
    venue: 'HITEX Exhibition Centre, Madhapur, Hyderabad',
    seats: 600,
    ticketTypes: [],
    status: 'Approved',
    image: '/images/events/photos/ai-automation-expo.jpg',
    previewOnly: true,
  },
  {
    id: 'preview-06',
    title: 'Hyderabad Startup Pitch and Networking Night',
    description: 'Hear startup pitches and connect with founders, mentors, and Hyderabad’s tech community.',
    category: 'Business',
    date: '27 Mar 2027',
    time: '5:00 PM',
    venue: 'T-Hub, Raidurg, Hyderabad',
    seats: 300,
    ticketTypes: [],
    status: 'Approved',
    image: '/images/events/photos/startup-pitch-night.jpg',
    previewOnly: true,
  },
  {
    id: 'preview-07',
    title: 'Tollywood Melodies: Orchestra Night',
    description: 'A live orchestra performs memorable Telugu film melodies and South Indian favorites.',
    category: 'Music',
    date: '10 Apr 2027',
    time: '6:30 PM',
    venue: 'Ravindra Bharathi, Saifabad, Hyderabad',
    seats: 1000,
    ticketTypes: [],
    status: 'Approved',
    image: '/images/events/photos/sunset-music-festival.jpg',
    previewOnly: true,
  },
  {
    id: 'preview-08',
    title: 'Charminar Heritage Photography Walk',
    description: 'Join an early-morning photo walk around Charminar and Laad Bazaar with photography tips.',
    category: 'Photography',
    date: '24 Apr 2027',
    time: '6:30 AM',
    venue: 'Charminar East Entrance, Old City, Hyderabad',
    seats: 35,
    ticketTypes: [],
    status: 'Approved',
    image: '/images/events/photos/city-marathon-2026.jpg',
    previewOnly: true,
  },
  {
    id: 'preview-09',
    title: 'Hyderabad Women in Technology Meetup',
    description: 'Short tech talks, career stories, mentoring, and networking in a welcoming space.',
    category: 'Technology',
    date: '15 May 2027',
    time: '10:00 AM',
    venue: 'HICC, HITEC City, Hyderabad',
    seats: 400,
    ticketTypes: [],
    status: 'Approved',
    image: '/images/events/photos/women-in-business-breakfast.jpg',
    previewOnly: true,
  },
  {
    id: 'preview-10',
    title: 'Hyderabad Dandiya Raas Night',
    description: 'A festive evening of dandiya raas, garba circles, folk rhythms, and dancing.',
    category: 'Cultural',
    date: '2 Oct 2027',
    time: '6:30 PM',
    venue: 'Gachibowli Indoor Stadium, Hyderabad',
    seats: 1800,
    ticketTypes: [],
    status: 'Approved',
    image: '/images/events/photos/sunset-music-festival.jpg',
    previewOnly: true,
  },
]
const normalizeRole = (role) => {
  const value = String(role || 'USER').toUpperCase()
  return ['ADMIN', 'ORGANIZER', 'USER'].includes(value) ? value : 'USER'
}

const normalizeStatus = (status) => {
  const value = String(status || '').toUpperCase()

  if (value === 'APPROVED') return 'Approved'
  if (value === 'REJECTED') return 'Rejected'
  if (value === 'PENDING') return 'Pending'
  if (value === 'CONFIRMED') return 'Confirmed'
  if (value === 'CHECKED_IN') return 'Checked in'

  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : 'Pending'
}

const normalizeUser = (user) => ({
  ...user,
  role: normalizeRole(user?.role),
})

const normalizeRegistration = (registration) => ({
  ...registration,
  status: normalizeStatus(registration?.status),
})

const buildBookingReference = (registration, event) => {
  if (registration?.ticketCode) {
    return registration.ticketCode.toUpperCase()
  }

  const eventId = event?.id ?? registration?.eventId ?? 'guest'
  const userId = registration?.userId ?? 'member'
  const bookingId = registration?.id ?? `${eventId}-${userId}`

  return `EVT-${eventId}-${userId}-${bookingId}`.toUpperCase()
}

const normalizeEvent = (event) => ({
  ...event,
  id: Number(event.id),
  seats: Number(event.seats ?? 100),
  status: normalizeStatus(event.status),
  organizerId: Number(event.organizerId ?? event.organizer?.id ?? 0),
  organizerName: event.organizerName ?? event.organizer?.name ?? 'Organizer',
  date: event.date ? String(event.date).split('T')[0] : event.date,
  time: event.time ? String(event.time).slice(0, 5) : event.time,
  ticketTypes: Array.isArray(event.ticketTypes)
    ? event.ticketTypes.map((ticketType) => ({
        ...ticketType,
        id: Number(ticketType.id),
        pricePaise: Number(ticketType.pricePaise ?? 0),
        capacity: Number(ticketType.capacity ?? 0),
        available: Number(ticketType.available ?? ticketType.capacity ?? 0),
      }))
    : [],
  image:
    event.imageUrl ||
    seededEventImages[event.title] ||
    event.image ||
    categoryImages[String(event.category || '').toLowerCase()] ||
    '/images/events/technology.svg',
})

const formatInr = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((Number(paise) || 0) / 100)

const loadStoredToken = () => window.localStorage.getItem(tokenStorageKey) || ''

const assistantCategories = {
  tech: 'technology',
  technology: 'technology',
  ai: 'technology',
  business: 'business',
  startup: 'finance',
  finance: 'finance',
  health: 'health',
  fitness: 'health',
  run: 'health',
  music: 'entertainment',
  entertainment: 'entertainment',
  food: 'food',
  cooking: 'food',
  culture: 'culture',
  art: 'culture',
  education: 'education',
  workshop: 'education',
}

const answerEventQuestion = (question, events, currentUser, myEvents) => {
  const normalizedQuestion = question.toLowerCase()
  const today = new Date().toISOString().slice(0, 10)
  const upcomingEvents = events
    .filter((event) => event.status === 'Approved' && event.date >= today)
    .sort((first, second) => first.date.localeCompare(second.date))
  const words = normalizedQuestion.match(/[a-z0-9]+/g) || []
  const requestedCategory = words
    .map((word) => assistantCategories[word])
    .find(Boolean)

  if (/\b(my bookings|my tickets|my registrations|bookings|tickets)\b/.test(normalizedQuestion)) {
    if (!currentUser) {
      return {
        text: 'Sign in to see your bookings and digital passes. Once you are signed in, I can show them here.',
        events: [],
      }
    }

    if (!myEvents.length) {
      return {
        text: 'You do not have any bookings yet. Tell me what you are interested in and I can help you find an event.',
        events: [],
      }
    }

    return {
      text: `You have ${myEvents.length} booking${myEvents.length === 1 ? '' : 's'}:`,
      events: myEvents.map((booking) => booking.event),
    }
  }

  if (/\b(book|booking|register|registration|reserve|ticket|tickets)\b/.test(normalizedQuestion)) {
    return {
      text: currentUser
        ? 'To book a place, open an approved event, choose “Book now”, then confirm your ticket. Your confirmed booking and digital pass will appear in your dashboard.'
        : 'Browse approved events, then sign in or create an account to reserve a place. Your confirmed booking and digital pass will appear in your dashboard.',
      events: [],
    }
  }

  if (/\b(organize|host|create|submit|post)\b/.test(normalizedQuestion)) {
    return {
      text: 'Organizers can sign in with an organizer account, open the dashboard, and submit an event for admin review. Approved events appear in the public event catalog.',
      events: [],
    }
  }

  if (/\b(upcoming|soon|happening|coming up|what'?s on|available)\b/.test(normalizedQuestion)) {
    return {
      text: upcomingEvents.length
        ? 'Here are a few upcoming approved events:'
        : 'There are no approved upcoming events to recommend right now. Check back soon for new listings.',
      events: upcomingEvents.slice(0, 3),
    }
  }

  const searchTerms = words.filter(
    (word) =>
      word.length > 2 &&
      ![
        'the', 'and', 'for', 'with', 'are', 'what', 'when', 'where', 'find', 'show',
        'some', 'want', 'like', 'this', 'that', 'from', 'near', 'upcoming', 'event', 'events',
      ].includes(word),
  )
  const scoredEvents = upcomingEvents
    .map((event) => {
      const title = event.title.toLowerCase()
      const category = event.category.toLowerCase()
      const venue = event.venue.toLowerCase()
      const description = event.description.toLowerCase()
      const score = searchTerms.reduce(
        (total, word) =>
          total +
          (title.includes(word) ? 4 : 0) +
          (category.includes(word) ? 3 : 0) +
          (venue.includes(word) ? 2 : 0) +
          (description.includes(word) ? 1 : 0),
        0,
      )

      return { event, score }
    })
    .filter(({ event, score }) => score > 0 || (requestedCategory && event.category.toLowerCase() === requestedCategory))
    .sort(
      (first, second) =>
        Number(second.event.category.toLowerCase() === requestedCategory) -
          Number(first.event.category.toLowerCase() === requestedCategory) ||
        second.score - first.score ||
        first.event.date.localeCompare(second.event.date),
    )
    .slice(0, 3)
    .map(({ event }) => event)

  if (scoredEvents.length) {
    return {
      text: requestedCategory
        ? `Here are some upcoming ${requestedCategory} events you might like:`
        : 'Here are a few upcoming events that match your interests:',
      events: scoredEvents,
    }
  }

  if (/\b(hi|hello|hey|help|thank|thanks)\b/.test(normalizedQuestion)) {
    return {
      text: 'I can help you discover events, find bookings, and explain how to reserve a place or organize an event. What are you looking for?',
      events: [],
    }
  }

  return {
    text: upcomingEvents.length
      ? 'I could not find an exact match. Try a category like technology, business, music, food, culture, health, or education.'
      : 'There are no approved upcoming events to recommend right now. Check back soon for new listings.',
    events: [],
  }
}

function EventAssistant({ events, currentUser, myEvents, onViewEvent }) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I can help you find events, check your bookings, or get started with EventHub. What are you looking for?',
      events: [],
    },
  ])
  const messageEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [isOpen, messages])

  const sendMessage = (message = draft) => {
    const text = message.trim()
    if (!text) return

    const reply = answerEventQuestion(text, events, currentUser, myEvents)
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', text, events: [] },
      { id: `assistant-${Date.now()}`, role: 'assistant', ...reply },
    ])
    setDraft('')
  }

  return (
    <div className="event-assistant">
      {isOpen && (
        <section className="assistant-panel" aria-label="EventHub event assistant">
          <header className="assistant-header">
            <span className="assistant-avatar"><Sparkles size={18} /></span>
            <div className="assistant-heading">
              <strong>EventHub Guide</strong>
              <span><span className="assistant-online-dot" /> Your event guide</span>
            </div>
            <button
              type="button"
              className="assistant-close"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
            >
              <X size={19} />
            </button>
          </header>

          <div className="assistant-context">
            <Bot size={15} />
            Answers are based on EventHub listings and your account.
          </div>

          <div className="assistant-messages" aria-live="polite">
            {messages.map((message) => (
              <article key={message.id} className={`assistant-message assistant-message-${message.role}`}>
                {message.role === 'assistant' && (
                  <span className="assistant-message-avatar"><Sparkles size={13} /></span>
                )}
                <div className="assistant-message-content">
                  <p>{message.text}</p>
                  {message.events.length > 0 && (
                    <div className="assistant-event-list">
                      {message.events.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          className="assistant-event-card"
                          onClick={() => {
                            onViewEvent(event)
                            setIsOpen(false)
                          }}
                        >
                          <span className="assistant-event-icon"><CalendarDays size={15} /></span>
                          <span className="assistant-event-copy">
                            <strong>{event.title}</strong>
                            <small><MapPin size={12} /> {event.venue} · {event.date}</small>
                          </span>
                          <ArrowUpRight size={15} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
            <div ref={messageEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="assistant-suggestions" aria-label="Suggested questions">
              {['Find tech events', 'What can I book?', 'How do I organize an event?'].map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form
            className="assistant-composer"
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage()
            }}
          >
            <label className="sr-only" htmlFor="assistant-message">Message the EventHub guide</label>
            <input
              id="assistant-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about events, bookings..."
              autoComplete="off"
            />
            <button type="submit" aria-label="Send message" disabled={!draft.trim()}>
              <Send size={17} />
            </button>
          </form>
          <p className="assistant-footnote">Event suggestions are based on current listings.</p>
        </section>
      )}

      <button
        type="button"
        className={`assistant-launcher${isOpen ? ' assistant-launcher-open' : ''}`}
        aria-label={isOpen ? 'Close EventHub guide' : 'Open EventHub guide'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X size={22} /> : <><MessageCircle size={21} /><span>EventHub guide</span></>}
      </button>
    </div>
  )
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(loadStoredTheme)
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const activeView = viewForPath(location.pathname)
  const setActiveView = (view, role = currentUser?.role) => {
    const paths = {
      home: '/',
      login: '/login',
      register: '/register',
      events: '/events',
      dashboard: dashboardPath(role),
      create: '/organizer/events/create',
      checkin: '/organizer/events',
    }
    navigate(paths[view] || '/')
  }
  const [authMode, setAuthMode] = useState(() => location.pathname === '/register' ? 'register' : 'login')
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [message, setMessage] = useState('Welcome back! Explore upcoming events and manage bookings.')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [authForm, setAuthForm] = useState(authDefaults)
  const [eventForm, setEventForm] = useState(emptyEventForm)
  const [editingEventId, setEditingEventId] = useState(null)
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState('')
  const [ticketQuantity, setTicketQuantity] = useState(1)
  const [isReservingTickets, setIsReservingTickets] = useState(false)
  const [token, setToken] = useState(loadStoredToken)
  const [checkInReference, setCheckInReference] = useState('')
  const [checkInResult, setCheckInResult] = useState(null)
  const [cameraError, setCameraError] = useState('')
  const [isCameraScanning, setIsCameraScanning] = useState(false)
  const [eventAttendees, setEventAttendees] = useState([])
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [attendeeDataEventId, setAttendeeDataEventId] = useState('')
  const [selectedCheckInEventId, setSelectedCheckInEventId] = useState('')
  const showCatalogPreview = events.length === 0 && (!currentUser || activeView === 'events')
  const catalogEvents = showCatalogPreview ? frontendPreviewEvents : events

  useEffect(() => {
    window.localStorage.setItem(themeStorageKey, theme)
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    const clearExpiredSession = () => {
      setToken('')
      setCurrentUser(null)
      navigate('/login')
      setMessage('Your session expired. Please sign in again.')
    }
    window.addEventListener('eventhub:unauthorized', clearExpiredSession)
    return () => window.removeEventListener('eventhub:unauthorized', clearExpiredSession)
  }, [navigate])
  const cameraVideoRef = useRef(null)
  const cameraSessionRef = useRef(null)

  const chooseEvent = (event) => {
    setSelectedEvent(event)
    setSelectedTicketTypeId(event.ticketTypes?.[0]?.id ?? '')
    setTicketQuantity(1)
    navigate(`/events/${event.id}`)
  }
  const handleBookNow = async (event) => {
    if (!currentUser) {
      setMessage('Please sign in before booking this event.')
      setActiveView('login')
      return
    }
    if (currentUser.role !== 'USER') {
      setMessage('Only regular users can purchase tickets.')
      return
    }
    if (event.previewOnly || !Number.isFinite(Number(event.id)) || event.status !== 'Approved') {
      setMessage('This event is not available for booking yet.')
      return
    }

    const ticketType = event.ticketTypes.find((item) => item.available >= 1)
    if (!ticketType) {
      setMessage('There are no tickets available for this event.')
      return
    }
    if (ticketType.pricePaise > 0) {
      chooseEvent(event)
      setMessage('Review the ticket type and price, then confirm your booking.')
      return
    }

    setIsReservingTickets(true)
    try {
      const tickets = (await registerForEvent(event.id, ticketType.id, 1, token)).map(normalizeRegistration)
      setRegistrations((current) => [...tickets, ...current])
      setMessage(`${event.title} is booked. Your ticket is now in your dashboard.`)
      setActiveView('dashboard')
    } catch (error) {
      setMessage(error.message || 'Unable to book this event.')
    } finally {
      setIsReservingTickets(false)
    }
  }

  useEffect(() => {
    const match = location.pathname.match(/^\/events\/(\d+)$/)
    if (!match) return
    const event = events.find((item) => String(item.id) === match[1])
    if (event) {
      setSelectedEvent(event)
      setSelectedTicketTypeId(event.ticketTypes?.[0]?.id ?? '')
    }
  }, [location.pathname, events])

  const loadPublicEvents = async () => {
    try {
      const data = await fetchPublicEvents()
      const normalizedEvents = Array.isArray(data) ? data.map(normalizeEvent) : []
      setEvents(normalizedEvents)
      setSelectedEvent((current) =>
        normalizedEvents.find((item) => item.id === current?.id) ?? normalizedEvents[0] ?? null,
      )
    } catch (error) {
      setMessage(`Could not load events from the backend: ${error.message}`)
    }
  }

  const loadUserSession = async (sessionToken) => {
    let user
    try {
      const profile = await fetchCurrentUserProfile(sessionToken)
      user = normalizeUser(profile)

      setCurrentUser(user)
      setUsers((current) => {
        const filtered = current.filter(
          (entry) => entry.email.toLowerCase() !== user.email.toLowerCase(),
        )
        return [user, ...filtered]
      })
    } catch (error) {
      localStorage.removeItem(tokenStorageKey)
      setToken('')
      setCurrentUser(null)
      setMessage(`Your session could not be verified: ${error.message}`)
      return
    }

    try {
      const [eventData, registrationData, userData] = await Promise.all([
        user.role === 'ADMIN'
          ? fetchAdminEvents(sessionToken)
          : user.role === 'ORGANIZER'
            ? fetchOrganizerEvents(sessionToken)
            : fetchPublicEvents(),
        user.role === 'ADMIN' ? fetchAdminRegistrations(sessionToken) : fetchMyRegistrations(sessionToken),
        user.role === 'ADMIN' ? fetchAdminUsers(sessionToken) : Promise.resolve(null),
      ])
      const normalizedEvents = Array.isArray(eventData) ? eventData.map(normalizeEvent) : []
      let allRegistrations = Array.isArray(registrationData) ? registrationData : []
      if (user.role === 'ORGANIZER') {
        const attendeeLists = await Promise.all(
          normalizedEvents.map((event) => fetchEventRegistrations(event.id, sessionToken)),
        )
        allRegistrations = attendeeLists.flat()
      }

      setEvents(normalizedEvents)
      setSelectedEvent((current) =>
        normalizedEvents.find((item) => item.id === current?.id) ?? normalizedEvents[0] ?? null,
      )
      setRegistrations(
        allRegistrations.map(normalizeRegistration),
      )
      if (Array.isArray(userData)) {
        setUsers(userData.map(normalizeUser))
      }
    } catch (error) {
      setMessage(`Signed in, but could not load your database data: ${error.message}`)
    }
  }

  useEffect(() => {
    if (token) {
      loadUserSession(token)
    } else {
      loadPublicEvents()
    }
  }, [token])

  useEffect(() => {
    if (!currentUser) {
      if (!token && /^\/(user|organizer|admin)\//.test(location.pathname)) navigate('/login', { replace: true })
      return
    }
    const prefix = location.pathname.split('/')[1]?.toUpperCase()
    if (['USER', 'ORGANIZER', 'ADMIN'].includes(prefix) && prefix !== currentUser.role) {
      navigate(dashboardPath(currentUser.role), { replace: true })
    }
  }, [currentUser, token, location.pathname, navigate])

  const categories = useMemo(
    () => ['All', ...new Set(catalogEvents.map((event) => event.category))],
    [catalogEvents],
  )

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return catalogEvents.filter((event) => {
      const matchesSearch =
        !normalizedSearch ||
        event.title.toLowerCase().includes(normalizedSearch) ||
        event.description.toLowerCase().includes(normalizedSearch) ||
        event.venue.toLowerCase().includes(normalizedSearch)

      const matchesCategory =
        selectedCategory === 'All' || event.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [catalogEvents, searchTerm, selectedCategory])

  const myEvents = useMemo(
    () =>
      currentUser
        ? registrations
            .filter((registration) => registration.userId === currentUser.id)
            .map((registration) => {
              const event = events.find((item) => item.id === registration.eventId)
              return {
                ...registration,
                event,
                bookingReference: buildBookingReference(registration, event),
              }
            })
            .filter((item) => item.event)
        : [],
    [currentUser, registrations, events],
  )

  const selectedBooking = useMemo(
    () =>
      selectedEvent && currentUser
        ? myEvents.find((item) => item.eventId === selectedEvent.id) ?? null
        : null,
    [selectedEvent, currentUser, myEvents],
  )

  const organizerEvents = useMemo(
    () =>
      currentUser && currentUser.role === 'ORGANIZER'
        ? events.filter((event) => event.organizerId === currentUser.id)
        : [],
    [currentUser, events],
  )
  useEffect(() => {
    const match = location.pathname.match(/^\/organizer\/events\/edit\/(\d+)$/)
    if (!match || currentUser?.role !== 'ORGANIZER') return
    const event = organizerEvents.find((item) => item.id === Number(match[1]))
    if (!event || editingEventId === event.id) return
    setEditingEventId(event.id)
    setEventForm({
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl || '',
      category: event.category,
      date: event.date,
      time: event.time,
      venue: event.venue,
      seats: String(event.seats),
      ticketTypes: event.ticketTypes.map((ticket) => ({
        name: ticket.name,
        price: String(ticket.pricePaise / 100),
        capacity: String(ticket.capacity),
      })),
    })
  }, [location.pathname, currentUser, organizerEvents, editingEventId])
  const hasSelectedCheckInEvent = organizerEvents.some(
    (event) => String(event.id) === selectedCheckInEventId,
  )
  const checkInEventId = hasSelectedCheckInEvent
    ? selectedCheckInEventId
    : String(organizerEvents[0]?.id ?? '')
  const checkInEvent = organizerEvents.find((event) => String(event.id) === checkInEventId)
  const isLoadingAttendees =
    activeView === 'checkin' && Boolean(checkInEventId) && attendeeDataEventId !== checkInEventId
  const displayedAttendees =
    attendeeDataEventId === checkInEventId ? eventAttendees : []

  useEffect(() => {
    if (activeView !== 'checkin' || currentUser?.role !== 'ORGANIZER' || !checkInEventId) {
      return undefined
    }
    let isCurrentRequest = true
    fetchEventRegistrations(checkInEventId, token)
      .then((data) => {
        if (isCurrentRequest) {
          setEventAttendees(Array.isArray(data) ? data.map(normalizeRegistration) : [])
          setAttendeeDataEventId(checkInEventId)
        }
      })
      .catch((error) => {
        if (isCurrentRequest) {
          setMessage(`Could not load the attendee list: ${error.message}`)
          setEventAttendees([])
          setAttendeeDataEventId(checkInEventId)
        }
      })

    return () => {
      isCurrentRequest = false
    }
  }, [activeView, checkInEventId, currentUser, token])

  useEffect(
    () => () => {
      const session = cameraSessionRef.current
      if (session) {
        session.cancelled = true
        session.controls?.stop()
        cameraSessionRef.current = null
        setIsCameraScanning(false)
      }
    },
    [activeView],
  )

  const stats = {
    totalUsers: users.length,
    totalOrganizers: users.filter((user) => user.role === 'ORGANIZER').length,
    totalEvents: events.length,
    pendingApprovals: events.filter((event) => event.status === 'Pending').length,
    approvedEvents: events.filter((event) => event.status === 'Approved').length,
    rejectedEvents: events.filter((event) => event.status === 'Rejected').length,
    registrations: registrations.length,
  }
  const passwordStrength = [
    authForm.password.length >= 8,
    /[a-z]/.test(authForm.password) && /[A-Z]/.test(authForm.password),
    /\d/.test(authForm.password),
    authForm.password.length >= 12 || /[^a-zA-Z0-9]/.test(authForm.password),
  ].filter(Boolean).length
  const passwordStrengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength]

  const handleAuthFieldChange = (event) => {
    const { name, type, value, checked } = event.target
    setAuthForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()

    if (authMode === 'register') {
      if (authForm.password !== authForm.confirmPassword) {
        setMessage('Your passwords do not match.')
        return
      }

      if (!authForm.agreedToTerms) {
        setMessage('Please agree to the terms and privacy policy to create an account.')
        return
      }
    }

    setIsSubmittingAuth(true)
    try {
      if (authMode === 'login') {
        const result = await loginUser({
          email: authForm.email.trim(),
          password: authForm.password,
        })

        const user = normalizeUser(result.user)
        const nextToken = result.token

        setToken(nextToken)
        localStorage.setItem(tokenStorageKey, nextToken)
        setCurrentUser(user)
        setUsers((current) => {
          const filtered = current.filter(
            (entry) => entry.email.toLowerCase() !== user.email.toLowerCase(),
          )
          return [user, ...filtered]
        })
        setActiveView('dashboard', user.role)
        setMessage(`Welcome back, ${user.name}. Your ${user.role.toLowerCase()} dashboard is ready.`)
        setAuthForm(authDefaults)
        return
      }

      const result = await registerUser({
        name: authForm.name.trim(),
        email: authForm.email.trim(),
        password: authForm.password,
        phone: authForm.phone,
        role: 'USER',
      })

      const user = normalizeUser(result.user)
      const nextToken = result.token

      setToken(nextToken)
      localStorage.setItem(tokenStorageKey, nextToken)
      setCurrentUser(user)
      setUsers((current) => [user, ...current.filter((entry) => entry.email.toLowerCase() !== user.email.toLowerCase())])
      setActiveView('dashboard', user.role)
      setMessage('Your account was created successfully.')
      setAuthForm(authDefaults)
    } catch (error) {
      setMessage(
        authMode === 'login'
          ? `Login failed: ${error.message}`
          : `Account creation failed: ${error.message}`,
      )
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  const handleEventFieldChange = (event) => {
    const { name, value } = event.target
    setEventForm((current) => {
      if (name === 'seats' && current.ticketTypes.length === 1) {
        return {
          ...current,
          seats: value,
          ticketTypes: [{ ...current.ticketTypes[0], capacity: value }],
        }
      }
      return { ...current, [name]: value }
    })
  }

  const handleTicketTypeChange = (index, field, value) => {
    setEventForm((current) => ({
      ...current,
      ticketTypes: current.ticketTypes.map((ticketType, ticketIndex) =>
        ticketIndex === index ? { ...ticketType, [field]: value } : ticketType,
      ),
    }))
  }

  const handleCreateEvent = async (event) => {
    event.preventDefault()

    if (!currentUser || currentUser.role !== 'ORGANIZER') {
      setMessage('Only organizers can create events.')
      return
    }

    const seats = Number(eventForm.seats) || 100
    const ticketTypes = eventForm.ticketTypes.map((ticketType) => ({
      name: ticketType.name.trim(),
      pricePaise: Math.round(Number(ticketType.price) * 100),
      capacity: Number(ticketType.capacity),
    }))
    if (ticketTypes.reduce((total, ticketType) => total + ticketType.capacity, 0) > seats) {
      setMessage('The combined ticket tier capacity cannot exceed total event seats.')
      return
    }

    const payload = {
      title: eventForm.title,
      description: eventForm.description,
      imageUrl: eventForm.imageUrl.trim(),
      category: eventForm.category,
      date: eventForm.date,
      time: eventForm.time,
      venue: eventForm.venue,
      seats,
      ticketTypes,
    }

    try {
      const savedEvent = normalizeEvent(
        editingEventId
          ? await updateEvent(editingEventId, payload, token)
          : await createEvent(payload, token),
      )
      setEvents((current) => [
        savedEvent,
        ...current.filter((item) => item.id !== savedEvent.id),
      ])
      setEventForm(emptyEventForm)
      setEditingEventId(null)
      setMessage(editingEventId ? 'Event changes submitted for admin review.' : 'New event submitted for admin review. It is pending approval.')
    } catch (error) {
      setMessage(error.message || 'Could not create event through the backend.')
    }
  }

  const handleEditEvent = (event) => {
    setEditingEventId(event.id)
    setEventForm({
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl || '',
      category: event.category,
      date: event.date,
      time: event.time,
      venue: event.venue,
      seats: String(event.seats),
      ticketTypes: event.ticketTypes.map((ticket) => ({
        name: ticket.name,
        price: String(ticket.pricePaise / 100),
        capacity: String(ticket.capacity),
      })),
    })
    navigate(`/organizer/events/edit/${event.id}`)
  }

  const handleReserveTickets = async () => {
    if (!currentUser) {
      setMessage('Please log in before booking tickets.')
      return
    }

    if (currentUser.role !== 'USER') {
      setMessage('Only regular users can purchase tickets.')
      return
    }

    const event = selectedEvent
    if (!event || event.status !== 'Approved') {
      setMessage('This event is not approved for ticket sales yet.')
      return
    }

    const ticketTypeId = Number(selectedTicketTypeId || event.ticketTypes[0]?.id)
    const ticketType = event.ticketTypes.find((item) => item.id === ticketTypeId)
    if (!ticketType) {
      setMessage('Choose a ticket tier before continuing.')
      return
    }

    setIsReservingTickets(true)
    try {
      const tickets = (await registerForEvent(
        event.id,
        ticketType.id,
        Number(ticketQuantity),
        token,
      )).map(normalizeRegistration)
      setRegistrations((current) => [...tickets, ...current])
      setMessage(
        `${tickets.length} ${ticketType.name} ticket${tickets.length === 1 ? '' : 's'} reserved for ${event.title}. Total: ${formatInr(ticketType.pricePaise * tickets.length)}.`,
      )
      setActiveView('dashboard')

    } catch (error) {
      setMessage(error.message || 'Unable to reserve tickets for this event.')
    } finally {
      setIsReservingTickets(false)
    }
  }

  const handleStartCameraScan = async () => {
    if (!cameraVideoRef.current) {
      setCameraError('The camera preview is not ready. Try again.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not available. Open the app on localhost or HTTPS and use a supported browser.')
      return
    }

    setCameraError('')
    setCheckInResult(null)
    setIsCameraScanning(true)
    const session = { cancelled: false, controls: null }
    cameraSessionRef.current = session

    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser')
      const reader = new BrowserQRCodeReader()
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        cameraVideoRef.current,
        (result) => {
          if (!result || session.cancelled) {
            return
          }

          const scannedCode = result.getText().trim()
          if (!scannedCode) {
            return
          }

          session.cancelled = true
          session.controls?.stop()
          cameraSessionRef.current = null
          setIsCameraScanning(false)
          setCheckInReference(scannedCode)
          setMessage('QR code scanned. Verify the ticket to complete check-in.')
        },
      )

      if (session.cancelled) {
        controls.stop()
        return
      }
      session.controls = controls
    } catch (error) {
      session.cancelled = true
      cameraSessionRef.current = null
      setIsCameraScanning(false)
      setCameraError(
        error.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access in your browser and try again.'
          : `Could not start the camera: ${error.message || 'Check camera access and try again.'}`,
      )
    }
  }

  const handleStopCameraScan = () => {
    const session = cameraSessionRef.current
    if (session) {
      session.cancelled = true
      session.controls?.stop()
      cameraSessionRef.current = null
    }
    setIsCameraScanning(false)
  }

  const handleCheckIn = async (event) => {
    event.preventDefault()
    const bookingReference = checkInReference.trim()
    if (!bookingReference) {
      setMessage('Enter or scan a ticket reference before checking in.')
      return
    }

    if (!checkInEvent) {
      setMessage('Select an event before checking in a ticket.')
      return
    }

    setIsCheckingIn(true)
    try {
      const registration = normalizeRegistration(
        await checkInRegistration(bookingReference, checkInEvent.id, token),
      )
      setEventAttendees((current) => {
        if (registration.eventId !== checkInEvent.id) {
          return current
        }
        return current.map((attendee) =>
          attendee.id === registration.id ? registration : attendee,
        )
      })
      setAttendeeDataEventId(String(checkInEvent.id))
      setCheckInResult(registration)
      setCheckInReference('')
      setMessage('Ticket verified. Attendee checked in successfully.')
    } catch (error) {
      setMessage(error.message || 'Unable to check in this ticket.')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleCancelRegistration = async (registrationId) => {
    try {
      await cancelRegistration(registrationId, token)
    } catch (error) {
      setMessage(error.message || 'Unable to cancel this registration.')
      return
    }

    setRegistrations((current) =>
      current.filter((registration) => registration.id !== registrationId),
    )
    setMessage('Registration canceled successfully.')
  }

  const handleEventStatus = async (eventId, status) => {
    try {
      const updatedEvent = normalizeEvent(
        status === 'Approved' ? await approveEvent(eventId, token) : await rejectEvent(eventId, token),
      )

      setEvents((current) =>
        current.map((event) => (event.id === eventId ? updatedEvent : event)),
      )
      setMessage(`Event status changed to ${status}.`)
    } catch (error) {
      setMessage(error.message || 'Unable to update the event status.')
    }
  }

  const handleDeleteEvent = async (eventId) => {
    try {
      if (currentUser.role === 'ADMIN') {
        await deleteAdminEvent(eventId, token)
      } else {
        await deleteEvent(eventId, token)
      }
    } catch (error) {
      setMessage(error.message || 'Unable to delete this event.')
      return
    }

    setEvents((current) => current.filter((event) => event.id !== eventId))
    setRegistrations((current) =>
      current.filter((registration) => registration.eventId !== eventId),
    )
    setMessage('Event deleted and related registrations were removed.')
  }

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId, token)
    } catch (error) {
      setMessage(error.message || 'Unable to delete this user.')
      return
    }

    if (currentUser && currentUser.id === userId) {
      setCurrentUser(null)
      localStorage.removeItem(tokenStorageKey)
      setToken('')
    }

    setUsers((current) => current.filter((user) => user.id !== userId))
    setRegistrations((current) =>
      current.filter((registration) => registration.userId !== userId),
    )
    setMessage('User deleted successfully.')
  }

  const handlePromoteUser = async (userId) => {
    try {
      const updated = normalizeUser(await promoteUserToOrganizer(userId, token))
      setUsers((current) => current.map((user) => user.id === userId ? updated : user))
      setMessage(`${updated.name} can now organize events.`)
    } catch (error) {
      setMessage(error.message || 'Unable to update this user role.')
    }
  }

  const clearMessage = () => setMessage('')

  return (
    <div className="app-shell" data-theme={theme}>
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark">E</span>
          <div>
            <strong>EventHub</strong>
            <small>Smart event booking</small>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <button type="button" onClick={() => setActiveView('home')}>
            Home
          </button>
          <button type="button" onClick={() => setActiveView('events')}>
            Events
          </button>
          {currentUser && (
            <button type="button" onClick={() => setActiveView('dashboard')}>
              Dashboard
            </button>
          )}
        </nav>

        <div className="auth-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'light'}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          {currentUser ? (
            <>
              <div className="user-pill">{currentUser.name}</div>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setCurrentUser(null)
                  setToken('')
                  setRegistrations([])
                  setUsers([])
                  localStorage.removeItem(tokenStorageKey)
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setAuthMode('login')
                setActiveView('login')
              }}
            >
              Login / Register
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {!currentUser && activeView !== 'events' ? (
          <>
            <section className="hero-section">
              <div className="hero-copy">
                <span className="eyebrow">Complete event management</span>
                <h1>Discover Amazing Events</h1>
                <p>
                  Build vibrant communities around conferences, workshops, expos, fitness meetups,
                  and cultural experiences with a modern event platform.
                </p>
                <div className="cta-row">
                  <button type="button" className="primary-button" onClick={() => setActiveView('events')}>
                    Explore events
                  </button>
                  <button type="button" className="secondary-button" onClick={() => {
                    setAuthMode('register')
                    setActiveView('register')
                  }}>
                    Create account
                  </button>
                </div>
                <div className="stat-row">
                  <div>
                    <strong>{events.length}</strong>
                    <span>approved events</span>
                  </div>
                  <div>
                    <strong>{Math.max(0, categories.length - 1)}</strong>
                    <span>categories</span>
                  </div>
                  <div>
                    <strong>{myEvents.length}</strong>
                    <span>your bookings</span>
                  </div>
                </div>
              </div>

              <div className="auth-panel">
                <div className="mode-toggle">
                  <button
                    type="button"
                    className={authMode === 'login' ? 'active' : ''}
                    aria-pressed={authMode === 'login'}
                    onClick={() => {
                      setAuthMode('login')
                      setActiveView('login')
                    }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className={authMode === 'register' ? 'active' : ''}
                    aria-pressed={authMode === 'register'}
                    onClick={() => {
                      setAuthMode('register')
                      setActiveView('register')
                    }}
                  >
                    Register
                  </button>
                </div>

                <form className="auth-form" onSubmit={handleAuthSubmit}>
                  {authMode === 'register' && (
                    <label>
                      Full name
                      <input
                        type="text"
                        name="name"
                        value={authForm.name}
                        onChange={handleAuthFieldChange}
                        placeholder="Jane Doe"
                        autoComplete="name"
                        minLength={2}
                        maxLength={100}
                        autoCapitalize="words"
                        required
                      />
                    </label>
                  )}

                  <label>
                    Email
                    <input
                      type="email"
                      name="email"
                      value={authForm.email}
                      onChange={handleAuthFieldChange}
                      placeholder="name@example.com"
                      autoComplete="email"
                      maxLength={254}
                      required
                    />
                  </label>

                  <label>
                    Password
                    <div className="password-field">
                      <input
                        type={isPasswordVisible ? 'text' : 'password'}
                        name="password"
                        value={authForm.password}
                        onChange={handleAuthFieldChange}
                        placeholder="Enter password"
                        autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                        minLength={authMode === 'register' ? 8 : undefined}
                        maxLength={100}
                        pattern={
                          authMode === 'register'
                            ? '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,100}'
                            : undefined
                        }
                        title={
                          authMode === 'register'
                            ? 'Use 8–100 characters with uppercase, lowercase, and a number.'
                            : undefined
                        }
                        required
                      />
                      <button
                        type="button"
                        className="password-visibility"
                        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                        aria-pressed={isPasswordVisible}
                        onClick={() => setIsPasswordVisible((visible) => !visible)}
                      >
                        {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {authMode === 'register' && (
                      <>
                        <span className="password-hint">
                          Use 8+ characters with uppercase, lowercase, and a number.
                        </span>
                        {authForm.password && (
                          <div
                            className={`password-strength strength-${passwordStrength}`}
                            role="meter"
                            aria-label={`Password strength: ${passwordStrengthLabel}`}
                            aria-valuemin={0}
                            aria-valuemax={4}
                            aria-valuenow={passwordStrength}
                          >
                            <div className="strength-bars" aria-hidden="true">
                              {[1, 2, 3, 4].map((level) => (
                                <span
                                  key={level}
                                  className={passwordStrength >= level ? 'filled' : ''}
                                />
                              ))}
                            </div>
                            <span>{passwordStrengthLabel}</span>
                          </div>
                        )}
                      </>
                    )}
                  </label>

                  {authMode === 'register' && (
                    <>
                      <label>
                        Confirm password
                        <div className="password-field">
                          <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            name="confirmPassword"
                            value={authForm.confirmPassword}
                            onChange={handleAuthFieldChange}
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                            maxLength={100}
                            required
                          />
                          <button
                            type="button"
                            className="password-visibility"
                            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                            aria-pressed={isPasswordVisible}
                            onClick={() => setIsPasswordVisible((visible) => !visible)}
                          >
                            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </label>
                      <label>
                        Phone
                        <input
                          type="tel"
                          name="phone"
                          value={authForm.phone}
                          onChange={handleAuthFieldChange}
                          placeholder="+254 700 000 000"
                          autoComplete="tel"
                          pattern="^(?=(?:\D*\d){7,15}\D*$)\+?[0-9().\s-]{7,20}$"
                          title="Enter a valid phone number."
                          maxLength={20}
                          required
                        />
                      </label>
                      <label className="consent-field">
                        <input
                          type="checkbox"
                          name="agreedToTerms"
                          checked={authForm.agreedToTerms}
                          onChange={handleAuthFieldChange}
                          required
                        />
                        <span>I agree to EventHub’s terms and privacy policy.</span>
                      </label>
                    </>
                  )}

                  <button
                    type="submit"
                    className="primary-button submit-button"
                    disabled={isSubmittingAuth}
                  >
                    {isSubmittingAuth
                      ? authMode === 'login'
                        ? 'Signing in…'
                        : 'Creating account…'
                      : authMode === 'login'
                        ? 'Login to dashboard'
                        : 'Create account'}
                  </button>
                </form>

                {message && (
                  <div className="status-box" role="status" aria-live="polite">
                    <span>{message}</span>
                    <button type="button" onClick={clearMessage}>Dismiss</button>
                  </div>
                )}

              </div>
            </section>

            <section className="feature-showcase">
              <div className="featured-heading">
                <div>
                  <span className="eyebrow">Why EventHub</span>
                  <h2>Everything you need to host and attend memorable events</h2>
                </div>
              </div>
              <div className="feature-grid">
                {featureHighlights.map((feature) => (
                  <article key={feature.title} className="feature-card">
                    <div className="feature-icon">✓</div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="featured-section">
              <div className="featured-heading">
                <div>
                  <span className="eyebrow">Make a plan</span>
                  <h2>Upcoming events</h2>
                  <p>Find your next idea, new skill, or favourite memory.</p>
                  {showCatalogPreview && <p className="event-preview-note">Sample event cards are shown for frontend preview; registration is not active for these samples.</p>}
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setActiveView('events')}
                >
                  Browse all events
                </button>
              </div>
              <div className="featured-grid">
                {filteredEvents.slice(0, showCatalogPreview ? 10 : 6).map((event) => (
                  <article key={event.id} className="event-card muted-card">
                    <img className="event-image" src={event.image} alt={event.title} loading="lazy" />
                    <div className="event-badge">{event.category}</div>
                    <h3>{event.title}</h3>
                    <p>{event.description}</p>
                    <ul>
                      <li>{event.date}</li>
                      <li>{event.venue}</li>
                      <li>{event.seats} seats</li>
                      {event.ticketTypes.length > 0 && (
                        <li>
                          Tickets from {formatInr(Math.min(...event.ticketTypes.map((ticketType) => ticketType.pricePaise)))}
                        </li>
                      )}
                    </ul>
                    <div className="card-actions">
                      {event.previewOnly ? (
                        <button type="button" className="secondary-button" disabled>Book now</button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            chooseEvent(event)
                            setActiveView('events')
                          }}
                        >
                          View event
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : currentUser ? (
          <section className="dashboard-shell">
            <aside className="sidebar">
              <div className="side-heading">Navigation</div>
              <button
                type="button"
                className={activeView === 'dashboard' ? 'nav-active' : ''}
                onClick={() => setActiveView('dashboard')}
              >
                Overview
              </button>
              <button
                type="button"
                className={activeView === 'events' ? 'nav-active' : ''}
                onClick={() => setActiveView('events')}
              >
                Browse Events
              </button>
              {currentUser.role === 'ORGANIZER' && (
                <button
                  type="button"
                  className={activeView === 'checkin' ? 'nav-active' : ''}
                  onClick={() => setActiveView('checkin')}
                >
                  Ticket Check-in
                </button>
              )}
              {currentUser.role === 'ORGANIZER' && (
                <button
                  type="button"
                  className={activeView === 'create' ? 'nav-active' : ''}
                  onClick={() => setActiveView('create')}
                >
                  Create Event
                </button>
              )}
            </aside>

            <div className="dashboard-main">
              {currentUser.role === 'ADMIN' && (
                <>
                  <div className="metric-grid">
                    <div className="metric-card">
                      <span>Total users</span>
                      <strong>{stats.totalUsers}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Organizers</span>
                      <strong>{stats.totalOrganizers}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Total events</span>
                      <strong>{stats.totalEvents}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Approved</span>
                      <strong>{stats.approvedEvents}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Pending approvals</span>
                      <strong>{stats.pendingApprovals}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Rejected</span>
                      <strong>{stats.rejectedEvents}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Registrations</span>
                      <strong>{stats.registrations}</strong>
                    </div>
                  </div>

                  <div className="panel-block">
                    <div className="panel-header">
                      <h2>Manage events</h2>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Organizer</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((event) => (
                            <tr key={event.id}>
                              <td>{event.title}</td>
                              <td>{event.category}</td>
                              <td>
                                <span className={`status-pill status-${event.status.toLowerCase()}`}>
                                  {event.status}
                                </span>
                              </td>
                              <td>{event.organizerName}</td>
                              <td className="action-cell">
                                <button type="button" onClick={() => handleEventStatus(event.id, 'Approved')}>
                                  Approve
                                </button>
                                <button type="button" onClick={() => handleEventStatus(event.id, 'Rejected')}>
                                  Reject
                                </button>
                                <button type="button" onClick={() => handleDeleteEvent(event.id)}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="panel-block">
                    <div className="panel-header">
                      <h2>User directory</h2>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id}>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>{user.role}</td>
                              <td>
                                {user.role === 'USER' && (
                                  <button type="button" onClick={() => handlePromoteUser(user.id)}>
                                    Make organizer
                                  </button>
                                )}
                                <button type="button" onClick={() => handleDeleteUser(user.id)}>
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="panel-block">
                    <div className="panel-header">
                      <h2>All registrations</h2>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>Attendee</th><th>Event</th><th>Status</th><th>Ticket code</th></tr></thead>
                        <tbody>
                          {registrations.map((registration) => (
                            <tr key={registration.id}>
                              <td>{registration.userName}</td>
                              <td>{events.find((event) => event.id === registration.eventId)?.title || `Event #${registration.eventId}`}</td>
                              <td>{registration.status}</td>
                              <td>{registration.ticketCode}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {currentUser.role === 'ORGANIZER' && (
                <>
                  <div className="metric-grid">
                    <div className="metric-card">
                      <span>My events</span>
                      <strong>{organizerEvents.length}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Approved</span>
                      <strong>{organizerEvents.filter((event) => event.status === 'Approved').length}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Pending</span>
                      <strong>{organizerEvents.filter((event) => event.status === 'Pending').length}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Rejected</span>
                      <strong>{organizerEvents.filter((event) => event.status === 'Rejected').length}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Bookings</span>
                      <strong>{registrations.filter((reg) => organizerEvents.some((event) => event.id === reg.eventId)).length}</strong>
                    </div>
                  </div>

                  {activeView === 'checkin' && (
                    <div className="panel-block checkin-panel">
                      <div className="panel-header">
                        <div>
                          <h2>Ticket check-in</h2>
                          <p className="checkin-intro">
                            Scan a ticket with a QR reader or enter its unique ticket code. Each ticket can only be accepted once.
                          </p>
                        </div>
                        {organizerEvents.length > 0 && (
                          <label className="checkin-event-select">
                            Event
                            <select
                              value={checkInEventId}
                              onChange={(event) => {
                                handleStopCameraScan()
                                setSelectedCheckInEventId(event.target.value)
                                setCheckInResult(null)
                              }}
                            >
                              {organizerEvents.map((event) => (
                                <option key={event.id} value={String(event.id)}>
                                  {event.title}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      </div>

                      {!checkInEvent ? (
                        <p className="checkin-empty">
                          Create an event to start managing attendee entry.
                        </p>
                      ) : (
                        <>
                          <form className="checkin-form" onSubmit={handleCheckIn}>
                            <label htmlFor="ticket-reference">Ticket code</label>
                            <div className="camera-scan-actions">
                              <button
                                type="button"
                                className="secondary-button camera-scan-button"
                                onClick={isCameraScanning ? handleStopCameraScan : handleStartCameraScan}
                              >
                                {isCameraScanning ? <CameraOff size={18} /> : <Camera size={18} />}
                                {isCameraScanning ? 'Stop camera' : 'Scan with camera'}
                              </button>
                              <span>
                                {isCameraScanning
                                  ? 'Point the camera at the QR code on the ticket.'
                                  : 'Use your device camera to scan a ticket QR code.'}
                              </span>
                            </div>
                            <div className={`camera-preview ${isCameraScanning ? 'camera-preview-active' : ''}`}>
                              <video
                                ref={cameraVideoRef}
                                className="camera-preview-video"
                                muted
                                playsInline
                                aria-label="Live ticket QR scanner preview"
                              />
                              {isCameraScanning && <span className="camera-scan-frame" aria-hidden="true" />}
                            </div>
                            {cameraError && <p className="camera-error" role="alert">{cameraError}</p>}
                            <div className="checkin-input-row">
                              <input
                                id="ticket-reference"
                                type="text"
                                value={checkInReference}
                                onChange={(event) => setCheckInReference(event.target.value)}
                                placeholder="Scan or enter ticket code"
                                autoComplete="off"
                                maxLength="36"
                              />
                              <button
                                type="submit"
                                className="primary-button"
                                disabled={isCheckingIn || !checkInReference.trim()}
                              >
                                {isCheckingIn ? 'Verifying…' : 'Verify & check in'}
                              </button>
                            </div>
                          </form>

                          {checkInResult && (
                            <div className="checkin-success" role="status">
                              <strong>Entry approved</strong>
                              <span>
                                {checkInResult.userName || `Attendee ${checkInResult.userId}`} checked in for {checkInEvent.title}.
                              </span>
                            </div>
                          )}

                          <div className="checkin-stats">
                            <div>
                              <span>Tickets booked</span>
                              <strong>{displayedAttendees.length}</strong>
                            </div>
                            <div>
                              <span>Checked in</span>
                              <strong>{displayedAttendees.filter((attendee) => attendee.status === 'Checked in').length}</strong>
                            </div>
                            <div>
                              <span>Not arrived</span>
                              <strong>{displayedAttendees.filter((attendee) => attendee.status === 'Confirmed').length}</strong>
                            </div>
                          </div>

                          <div className="panel-header">
                            <h3>Attendee roster</h3>
                            {isLoadingAttendees && <span>Refreshing…</span>}
                          </div>
                          <div className="table-wrap">
                            <table>
                              <thead>
                                <tr>
                                  <th>Attendee</th>
                                  <th>Ticket reference</th>
                                  <th>Entry status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayedAttendees.map((attendee) => (
                                  <tr key={attendee.id}>
                                    <td>{attendee.userName || `Attendee ${attendee.userId}`}</td>
                                    <td>{buildBookingReference(attendee, checkInEvent)}</td>
                                    <td>
                                      <span className={`status-pill status-${attendee.status.toLowerCase().replaceAll(' ', '-')}`}>
                                        {attendee.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                                {!isLoadingAttendees && displayedAttendees.length === 0 && (
                                  <tr>
                                    <td colSpan="3">No bookings have been made for this event yet.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeView === 'create' && (
                    <div className="panel-block">
                      <div className="panel-header">
                        <h2>{editingEventId ? 'Edit event' : 'Create new event'}</h2>
                      </div>
                      <form className="event-form" onSubmit={handleCreateEvent}>
                        <div className="form-grid">
                          <label>
                            Event title
                            <input
                              type="text"
                              name="title"
                              value={eventForm.title}
                              onChange={handleEventFieldChange}
                              required
                            />
                          </label>
                          <label>
                            Category
                            <select name="category" value={eventForm.category} onChange={handleEventFieldChange}>
                              <option>Technical</option>
                              <option>Cultural</option>
                              <option>Sports</option>
                              <option>Workshop</option>
                              <option>Seminar</option>
                              <option>Conference</option>
                              <option>Hackathon</option>
                              <option>Fest</option>
                              <option>Other</option>
                            </select>
                          </label>
                          <label>
                            Date
                            <input
                              type="date"
                              name="date"
                              value={eventForm.date}
                              onChange={handleEventFieldChange}
                              required
                            />
                          </label>
                          <label>
                            Time
                            <input
                              type="time"
                              name="time"
                              value={eventForm.time}
                              onChange={handleEventFieldChange}
                              required
                            />
                          </label>
                          <label>
                            Venue
                            <input
                              type="text"
                              name="venue"
                              value={eventForm.venue}
                              onChange={handleEventFieldChange}
                              placeholder="e.g., HITEX, Madhapur, Hyderabad, Telangana, India"
                              required
                            />
                            <small>
                              Include the venue, city, state, and country. Hyderabad, India is the preferred location.
                            </small>
                          </label>
                          <label>
                            Seats
                            <input
                              type="number"
                              name="seats"
                              value={eventForm.seats}
                              onChange={handleEventFieldChange}
                              min="20"
                              required
                            />
                          </label>
                        </div>
                        <label>
                          Description
                          <textarea
                            name="description"
                            value={eventForm.description}
                            onChange={handleEventFieldChange}
                            rows="4"
                            required
                          />
                        </label>
                        <label>
                          Event photo URL (optional)
                          <input
                            type="text"
                            name="imageUrl"
                            value={eventForm.imageUrl}
                            onChange={handleEventFieldChange}
                            maxLength="500"
                            placeholder="https://... or /images/events/your-photo.jpg"
                          />
                          <small>
                            Use an HTTPS photo link, or leave this blank to use a relevant event
                            photo.
                          </small>
                        </label>
                        <div className="ticket-tier-editor">
                          <div className="panel-header">
                            <h3>Ticket tiers (INR)</h3>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                setEventForm((current) => ({
                                  ...current,
                                  ticketTypes: [
                                    ...current.ticketTypes,
                                    { name: '', price: '0', capacity: '1' },
                                  ],
                                }))
                              }
                            >
                              Add tier
                            </button>
                          </div>
                          {eventForm.ticketTypes.map((ticketType, index) => (
                            <div className="ticket-tier-form-row" key={`ticket-tier-${index}`}>
                              <label>
                                Tier name
                                <input
                                  type="text"
                                  value={ticketType.name}
                                  onChange={(changeEvent) => handleTicketTypeChange(index, 'name', changeEvent.target.value)}
                                  maxLength="100"
                                  required
                                />
                              </label>
                              <label>
                                Price (INR)
                                <input
                                  type="number"
                                  value={ticketType.price}
                                  onChange={(changeEvent) => handleTicketTypeChange(index, 'price', changeEvent.target.value)}
                                  min="0"
                                  step="0.01"
                                  required
                                />
                              </label>
                              <label>
                                Ticket quantity
                                <input
                                  type="number"
                                  value={ticketType.capacity}
                                  onChange={(changeEvent) => handleTicketTypeChange(index, 'capacity', changeEvent.target.value)}
                                  min="1"
                                  required
                                />
                              </label>
                              {eventForm.ticketTypes.length > 1 && (
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick={() =>
                                    setEventForm((current) => ({
                                      ...current,
                                      ticketTypes: current.ticketTypes.filter((_, ticketIndex) => ticketIndex !== index),
                                    }))
                                  }
                                >
                                  Remove tier
                                </button>
                              )}
                            </div>
                          ))}
                          <small>
                            Tier quantities must add up to no more than the event seat capacity. Use 0 for free tickets.
                          </small>
                        </div>
                        <button type="submit" className="primary-button">
                          {editingEventId ? 'Save changes' : 'Submit for approval'}
                        </button>
                        {editingEventId && <button type="button" className="secondary-button" onClick={() => {
                          setEditingEventId(null)
                          setEventForm(emptyEventForm)
                          setActiveView('create')
                        }}>Cancel edit</button>}
                      </form>
                    </div>
                  )}

                  <div className="panel-block">
                    <div className="panel-header">
                      <h2>My event portfolio</h2>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Attendees</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {organizerEvents.map((event) => (
                            <tr key={event.id}>
                              <td>{event.title}</td>
                              <td>{event.date}</td>
                              <td>
                                <span className={`status-pill status-${event.status.toLowerCase()}`}>
                                  {event.status}
                                </span>
                              </td>
                              <td>{registrations.filter((registration) => registration.eventId === event.id).length}</td>
                              <td className="action-cell">
                                <button type="button" onClick={() => handleEditEvent(event)}>Edit</button>
                                <button type="button" onClick={() => handleDeleteEvent(event.id)}>Delete</button>
                                <button type="button" onClick={() => {
                                  setSelectedCheckInEventId(String(event.id))
                                  setActiveView('checkin')
                                }}>Registrations</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {currentUser.role === 'USER' && (
                <>
                  <div className="profile-banner">
                    <div>
                      <span className="eyebrow">Member profile</span>
                      <h2>{currentUser.name}</h2>
                    </div>
                    <div className="profile-meta">
                      <span>{currentUser.email}</span>
                      <span>{currentUser.phone}</span>
                    </div>
                  </div>

                  <div className="metric-grid">
                    <div className="metric-card">
                      <span>Registered</span>
                      <strong>{myEvents.length}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Upcoming events</span>
                      <strong>{myEvents.filter((item) => item.event.date >= today).length}</strong>
                    </div>
                    <div className="metric-card">
                      <span>Profile status</span>
                      <strong>Active</strong>
                    </div>
                    <div className="metric-card">
                      <span>Completed</span>
                      <strong>{myEvents.filter((item) => item.event.date < today).length}</strong>
                    </div>
                  </div>

                  <div className="panel-block">
                    <div className="panel-header">
                      <h2>Your bookings</h2>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Booking QR</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myEvents.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <div className="booking-name-cell">
                                  <img className="booking-thumb" src={item.event.image} alt={item.event.title} />
                                  <span>{item.event.title}</span>
                                </div>
                              </td>
                              <td>{item.event.date}</td>
                              <td>
                                <span className="status-pill status-confirmed">{item.status}</span>
                              </td>
                              <td>
                                <div className="booking-qr-cell">
                                  <QRCodeSVG value={item.bookingReference} size={52} bgColor="#ffffff" fgColor="#111827" />
                                  <span>{item.bookingReference}</span>
                                </div>
                              </td>
                              <td>
                                <button type="button" onClick={() => handleCancelRegistration(item.id)}>
                                  Cancel
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {activeView === 'events' && (
                <div className="event-list-panel">
                  <div className="panel-header panel-header-stacked">
                    <h2>Event catalog</h2>
                    <div className="search-bar">
                      <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by title, venue, or keyword"
                      />
                      <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {showCatalogPreview && (
                    <p className="event-preview-note" role="note">Sample cards for frontend preview only. Booking is disabled until live events are added.</p>
                  )}

                  <div className="catalog-grid">
                    {filteredEvents.map((event) => (
                      <article key={event.id} className="event-card">
                        <img className="event-image" src={event.image} alt={event.title} loading="lazy" />
                        <div className="event-badge">{event.category}</div>
                        <h3>{event.title}</h3>
                        <p>{event.description}</p>
                        <ul>
                          <li>{event.date}</li>
                          <li>{event.time}</li>
                          <li>{event.venue}</li>
                          <li>{event.seats} seats</li>
                          {event.ticketTypes.length > 0 && (
                            <li>
                              Tickets from {formatInr(Math.min(...event.ticketTypes.map((ticketType) => ticketType.pricePaise)))}
                            </li>
                          )}
                        </ul>
                        <div className="card-actions">
                          {!event.previewOnly && (
                            <button type="button" onClick={() => chooseEvent(event)}>
                              Details
                            </button>
                          )}
                          {event.previewOnly ? (
                            <button type="button" className="secondary-button" disabled>
                              Preview only
                            </button>
                          ) : currentUser && currentUser.role === 'USER' ? (
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => handleBookNow(event)}
                              disabled={isReservingTickets || event.status !== 'Approved' || event.ticketTypes.length === 0}
                            >
                              {event.status !== 'Approved' ? 'Awaiting approval' : isReservingTickets ? 'Booking…' : event.ticketTypes.length ? 'Book now' : 'Tickets unavailable'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => setActiveView('home')}
                              disabled={Boolean(currentUser) || event.status !== 'Approved'}
                            >
                              {currentUser
                                ? 'Attendees only'
                                : event.status === 'Approved'
                                  ? 'Sign in'
                                  : 'Awaiting approval'}
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent && activeView === 'events' && (
                <aside className="details-panel">
                  <div className="panel-header">
                    <h3>{selectedEvent.title}</h3>
                  </div>
                  <div className="detail-stack">
                    <img className="detail-image" src={selectedEvent.image} alt={selectedEvent.title} />
                    <span className="event-badge">{selectedEvent.category}</span>
                    <div>
                      <h4>About this event</h4>
                      <p>{selectedEvent.description}</p>
                    </div>
                    <ul>
                      <li>
                        <strong>Date:</strong> {selectedEvent.date}
                      </li>
                      <li>
                        <strong>Time:</strong> {selectedEvent.time}
                      </li>
                      <li>
                        <strong>Venue:</strong> {selectedEvent.venue}
                      </li>
                      <li>
                        <strong>Status:</strong> {selectedEvent.status}
                      </li>
                    </ul>
                    {selectedEvent.ticketTypes.length > 0 && (
                      <div className="ticket-price-list">
                        <h4>Ticket prices</h4>
                        {selectedEvent.ticketTypes.map((ticketType) => (
                          <div key={ticketType.id}>
                            <span>{ticketType.name}</span>
                            <strong>{formatInr(ticketType.pricePaise)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedBooking ? (
                      <div className="booking-qr-panel">
                        <h4>Your booking QR</h4>
                        <div className="booking-qr-box">
                          <QRCodeSVG value={selectedBooking.bookingReference} size={120} bgColor="#ffffff" fgColor="#111827" />
                        </div>
                        <span>{selectedBooking.bookingReference}</span>
                      </div>
                    ) : null}
                    {currentUser?.role === 'USER' && selectedEvent.status === 'Approved' ? (
                      <div className="ticket-booking">
                        <h4>Choose your tickets</h4>
                        {selectedEvent.ticketTypes.length > 0 ? (
                          <>
                            <label>
                              Ticket tier
                              <select
                                value={selectedTicketTypeId || selectedEvent.ticketTypes[0].id}
                                onChange={(changeEvent) => setSelectedTicketTypeId(changeEvent.target.value)}
                              >
                                {selectedEvent.ticketTypes.map((ticketType) => (
                                  <option
                                    key={ticketType.id}
                                    value={ticketType.id}
                                    disabled={ticketType.available < 1}
                                  >
                                    {ticketType.name} — {formatInr(ticketType.pricePaise)} ({ticketType.available} left)
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Quantity
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={ticketQuantity}
                                onChange={(changeEvent) => setTicketQuantity(
                                  Math.max(1, Math.min(10, Number(changeEvent.target.value) || 1)),
                                )}
                              />
                            </label>
                            <p className="ticket-total">
                              Total: {formatInr(
                                (selectedEvent.ticketTypes.find(
                                  (ticketType) => ticketType.id === Number(selectedTicketTypeId || selectedEvent.ticketTypes[0].id),
                                )?.pricePaise || 0) * ticketQuantity,
                              )}
                            </p>
                            <button
                              type="button"
                              className="primary-button"
                              onClick={handleReserveTickets}
                              disabled={
                                isReservingTickets ||
                                !selectedEvent.ticketTypes.some(
                                  (ticketType) =>
                                    ticketType.id === Number(selectedTicketTypeId || selectedEvent.ticketTypes[0].id) &&
                                    ticketType.available >= ticketQuantity,
                                )
                              }
                            >
                              {isReservingTickets ? 'Booking…' : 'Confirm booking'}
                            </button>
                          </>
                        ) : (
                          <p>Ticket tiers are not available for this event yet.</p>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => setActiveView('home')}
                        disabled={selectedEvent.status !== 'Approved' || Boolean(currentUser)}
                      >
                        {selectedEvent.status !== 'Approved'
                          ? 'Awaiting approval'
                          : currentUser
                            ? 'Attendees only'
                            : 'Sign in to book'}
                      </button>
                    )}
                  </div>
                </aside>
              )}

              {message && (
                <div className="status-box dashboard-status">
                  <span>{message}</span>
                  <button type="button" onClick={clearMessage}>Close</button>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="guest-event-catalog">
            <div className="panel-header panel-header-stacked">
              <div>
                <span className="eyebrow">Find your next experience</span>
                <h2>Event catalog</h2>
              </div>
              <div className="search-bar">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by title, venue, or keyword"
                />
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {showCatalogPreview && (
              <p className="event-preview-note" role="note">Sample cards for frontend preview only. Booking is disabled until live events are added.</p>
            )}

            <div className="catalog-grid">
              {filteredEvents.map((event) => (
                <article key={event.id} className="event-card">
                  <img className="event-image" src={event.image} alt={event.title} loading="lazy" />
                  <div className="event-badge">{event.category}</div>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <ul>
                    <li>{event.date}</li>
                    <li>{event.time}</li>
                    <li>{event.venue}</li>
                    <li>{event.seats} seats</li>
                    {event.ticketTypes.length > 0 && (
                      <li>
                        Tickets from {formatInr(Math.min(...event.ticketTypes.map((ticketType) => ticketType.pricePaise)))}
                      </li>
                    )}
                  </ul>
                  <div className="card-actions">
                    {event.previewOnly ? (
                      <button type="button" className="secondary-button" disabled>Book now</button>
                    ) : (
                      <>
                        <button type="button" onClick={() => chooseEvent(event)}>
                          Details
                        </button>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => setActiveView('login')}
                          disabled={event.status !== 'Approved' || event.ticketTypes.length === 0}
                        >
                          {event.status === 'Approved' ? 'Book now' : 'Awaiting approval'}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {selectedEvent && (
              <aside className="details-panel">
                <div className="panel-header">
                  <h3>{selectedEvent.title}</h3>
                </div>
                <div className="detail-stack">
                  <img
                    className="detail-image"
                    src={selectedEvent.image}
                    alt={selectedEvent.title}
                  />
                  <span className="event-badge">{selectedEvent.category}</span>
                  <div>
                    <h4>About this event</h4>
                    <p>{selectedEvent.description}</p>
                  </div>
                  <ul>
                    <li><strong>Date:</strong> {selectedEvent.date}</li>
                    <li><strong>Time:</strong> {selectedEvent.time}</li>
                    <li><strong>Venue:</strong> {selectedEvent.venue}</li>
                  </ul>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setActiveView('login')}
                  >
                    Book now
                  </button>
                </div>
              </aside>
            )}
          </section>
        )}
      </main>
      <EventAssistant
        events={events}
        currentUser={currentUser}
        myEvents={myEvents}
        onViewEvent={(event) => {
          chooseEvent(event)
          setActiveView('events')
        }}
      />
    </div>
  )
}

export default App
