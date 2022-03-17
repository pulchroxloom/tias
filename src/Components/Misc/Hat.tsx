import React, { FC } from 'react'
import colorFromId from '../../modules/color'

function getData(): Array<string> {
	return [
		"Geralt of Rivia",
    "Gary Chess", 
    "Sandy Banks", 
    "King Gerold III",
    "Sharpness IV", 
    "Zelda DeLegendof",
    "Star Fox", 
		"Luigi Smansion", 
    "John Doom", 
    "Spongebob Squarepants",
    "Crash Bandishoot",
    "Suzzie Sunshine",
    "Mr. Generic",
    "Honda Accord",
    "K.K. Slider",
    "Gee Wilikers",
    "Mario Galaxy",
    "Ms. Generic",
    "Bubble Bass",
    "Sandy Cheeks",
    "Patrick",
    "Samus Errands",
    "Timmy Twix",
    "Marvin M&M",
    "Bikeal Roads",
    "Spicy Peppers",
    "Quintin QWERTY",
    "Asmorald ASDF",
    "Timmothy Tingle",
    "Kimmothy Kartz",
    "Zimmothy Zions",
    "Phoenix Wright",
    "Mia Fey",
    "Miles Edgeworth",
    "Maya Fey",
    "Pearl Fey",
    "Dick Gumshoe",
    "Franziska von Karma",
    "Ema Skye",
    "The Judge",
    "Apollo Justice",
    "Trucy Wright",
    "Athena Cykes",
    "Ryunosuke Naruhodo",
    "Susato Mikotoba",
    "Herlock Sholmes",
    "Iris Wilson",
    "Barok van Zieks",
    "Tetsutetsu Tetsutetsu",
    "Bobaboba Bobaboba",
    "Spike the Cowboy",
    "Guard the Reserve",
    "Hero Sandwich"
	];
}

interface Props {
  linkID: number, // An id that ties this dot corresponding dots elsewhere on the page
  name?: string, // A name to display in the hat
}

export const Hat: FC<Props> = ({linkID, name}) => {
  const {r, g, b, l} = colorFromId(linkID);
  const colors = {
    backgroundColor: `rgb(${r}, ${g}, ${b})`,
    color: (l <= 50)? 'white' : 'black'
  }

  return (
    <div 
      className="hat" 
      link-id={linkID} 
      title={getData()[linkID]}
      style={colors} 
      data-testid="hat"
    >{getData()[linkID]}</div>
  )
}
