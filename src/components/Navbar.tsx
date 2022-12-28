import Link from 'next/link'

const Navbar = () => {
  return <nav className="h-16 flex items-center p-4">
    <Link href="/login" className="h-10 w-10 rounded-full fill-current ml-auto">
      <Login/>
    </Link>
  </nav>
}

export default Navbar

const Login = () => {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path d="M24.45 42v-3H39V9H24.45V6H39q1.2 0 2.1.9.9.9.9 2.1v30q0 1.2-.9 2.1-.9.9-2.1.9Zm-3.9-9.25L18.4 30.6l5.1-5.1H6v-3h17.4l-5.1-5.1 2.15-2.15 8.8 8.8Z"/>
  </svg>
}