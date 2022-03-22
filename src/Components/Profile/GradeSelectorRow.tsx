import React, {FC} from 'react'
import red from '../../assets/red.png'
import green from '../../assets/green.png'


interface Props {
	element: string // The body of the list element
  color: string
}

export const GradeSelectorRow : FC<Props> = ({element, color}) => {

  const styles = { // FIXME: Help me ben
    backgroundColor : color,
    padding : "10px",
    margin : "2px",
    border : "1px"
  }


  let clr = (color == 'red')? red : green;

  return (
  <>
    <div className="hstack" style={{margin : "5px"}}>
      {element}
      <div className="fill element"/>
      <div className="element">
      <div className="dropdown">
        <button className="dropbtn">Preferences &#9660;</button>
        <div className="dropdown-content">
          <a href="#">Want to Teach</a>
          <a href="#">Indifferent</a>
          <a href="#">Rather Not Teach</a>
          <a href="#">Can't Teach</a>
        </div>
      </div>
      </div>
    <div style={styles}/>
    </div>
    <div className="hr-container">
      <hr/>
    </div>
  </>
  )
}