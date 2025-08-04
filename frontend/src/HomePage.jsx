import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import UserProfileCard from './UserProfileCard'

const HomePage = () => {
    const [data, setData] = useState([])
    useEffect(
        () => {
            fetch('http://localhost:8000/users')
            .then(res => res.json())
            .then(json => setData(json))
        }, []
    )
    console.log(data)
  return (
    <div>
         
        {
            data.map( (user) => {
                return <UserProfileCard user={user} />
            } )
        }

    </div>
  )
}

export default HomePage