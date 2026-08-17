import { useEffect, useState } from 'react'

function UseIsSmallScreen(breakPoint = 768) {
  const [isSmallScreen , setIsSmallScreen] = useState(false);

  useEffect(()=>{
    const mediaQuery = window.matchMedia(`(max-width:${breakPoint}px)`)
    
    // create a function to handle the change
    const handleMediaChange = (event:any) =>{
      setIsSmallScreen(event.matches)
    }

    //set inital state
    setIsSmallScreen(mediaQuery.matches)

    // add the event listener to the media query change
    mediaQuery.addEventListener('change' , handleMediaChange)

    //remove the event lister after exxecution
    return () =>{
      mediaQuery.removeEventListener('change' , handleMediaChange)
    }
  } , [])
  return isSmallScreen ;
}

export default UseIsSmallScreen;