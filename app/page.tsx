import Image from 'next/image'
import Darts from './tournaments/[id]/tables/[table]/darts'
import Tournament from './tournament'

export default function Home() {
  return (
    <Tournament/>
  )
}
