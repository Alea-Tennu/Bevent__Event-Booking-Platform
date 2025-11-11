import Image from "next/image"
import Link from "next/link"

const Navbar = () => {
  return (
    <header>
        <nav>
            <Link href={`/`} className="logo">
                <Image height={24} width={24} src={`/icons/logo.png`} alt="DevEvent Logo"/>
                <p>DevEvent</p>
            </Link>
            <ul>
                <Link href={`/`}>Home</Link>
                <Link href={`/`}>Events</Link>
                <Link href={`/`}>Create Event</Link>
            </ul>
        </nav>
    </header>
  )
}

export default Navbar