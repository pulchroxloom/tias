import React, { FC } from 'react'
import { Hat } from '../Misc/Hat';
import { APICourseBlock } from '../../modules/API';
import RenderBlockProps, { calcFlex } from './BlockBase';

const colors = new Map();
colors.set(110, '#4F405A');
colors.set(111, '#826a94');
colors.set(120, '#0e544f');
colors.set(121, '#0e544f');
colors.set(206, '#006b47');
colors.set(221, '#009489');
colors.set(222, '#5358AE');
colors.set(312, '#0086B6');
colors.set(313, '#434F6F');
colors.set(314, '#807391');
colors.set(315, '#6e438c');

interface Props extends RenderBlockProps {
  course_instance?: APICourseBlock
  linkIDs: number[] | null
}

export const SchedulingBlock: FC<Props> = ({course_instance, visible, linkIDs, size, inline}) => {
  let flex = calcFlex(visible, inline, size);

  const isVisible = {
    width: (visible)? undefined : 0,
    flex: flex,
    margin: visible? undefined : 0
  }
  
  const body = () => {
    if (linkIDs === null) return <></>
    else if (linkIDs.length === 0) {
      return (
        <div className="hat-container alert">
          < Hat linkID={-1} />
        </div>
      )
    } else {
      return (
        <div className="hat-container">
          {linkIDs?.map(id => (< Hat key={id} linkID={id} />))}
        </div>
      )
    }
  }

  let color = {background: 'red'};
  if (linkIDs === null || linkIDs.length !== 0) {
    color.background = colors.get(course_instance!.course_number)
    if (color.background === undefined) console.error('Color not defined for:', JSON.stringify(course_instance))
  } else {
    color.background = '#800000';
  }

  return (
    <div className={`block ${(linkIDs !== null && linkIDs.length === 0)? 'alert' : ''}`}
      title={`${course_instance!.course_number}-${course_instance!.section_number}`} 
      style={{...color, ...isVisible}}
    >
      { body() }
      <div className="fill"/>
      <div className={`block-text ${visible? '' : 'hidden'}`}>
        {course_instance!.course_number} {course_instance!.section_number}
      </div>
      <div className={`vstack block-detail ${visible? '' : 'hidden'}`}>
        <div>
          {course_instance!.department} {course_instance!.course_number}-{course_instance!.section_number}
        </div>
        <div>
          {course_instance!.place}
        </div>
      </div>
    </div>
  )
}
