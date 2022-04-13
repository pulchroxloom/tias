import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import { CourseBlock } from '../../modules/API';
import RenderBlockProps, { blockColors, calcFlex } from '../Scheduling/BlockBase';
import { toUpdateContext } from './SectionEditButton';

interface Props extends RenderBlockProps {
  data: {
    course_instance: CourseBlock
  }
}

export const SectionEditBlock: FC<Props> = ({visible, size, inline, data}) => {
  const {course_instance} = data;
  const [prof, setProf] = useState(course_instance.professor);
  const [desiredPTCount, setDesiredPTCount] = useState(course_instance.capacity_peer_teachers);
  
  const [interacted, setInteracted] = useState<boolean>(false);
  const [toUpdate, setToUpdate, unsaved, setUnsaved] = useContext(toUpdateContext);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  const ref: any = useRef(null);


  const formatDate = (date: Date) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = (hour === 12) ? 12 : hour % 12;
    const minutes = minute < 10 ? `0${minute}` : minute;
    return `${hour12}:${minutes} ${ampm}`;
  }

  const registerUpdate = () => {
    const where = toUpdate.findIndex(({section_id}) => section_id === course_instance.section_id);
    if (where === -1) {
      toUpdate.push({
        section_id: course_instance.section_id,
        placeholder_proffessor_name: prof,
        capacity_peer_teachers: desiredPTCount ?? 2
      })
    } else {
      toUpdate[where] = {
        section_id: course_instance.section_id,
        placeholder_proffessor_name: prof,
        capacity_peer_teachers: desiredPTCount ?? 2
      }
    }
    setToUpdate([...toUpdate]);
    if (unsaved) setUnsaved(unsaved - 1);
    setSaved(true);
    setUnsavedChanges(false);
  }

  const handleChange = <T,>(e: React.ChangeEvent<HTMLInputElement>, setter: (arg: T) => void, setWith: T) => {
    if (!unsaved) setUnsaved(unsaved + 1);
    setter(setWith);
    setUnsavedChanges(true);
  }

  let flex = calcFlex(visible, inline, size);

  const isVisible = {
    width: (visible)? undefined : 0,
    flex: flex,
    margin: visible? undefined : 0
  }

  // https://blog.logrocket.com/detect-click-outside-react-component-how-to/
  useEffect(() => { // Disables focus view on mouse click outside
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target) && interacted) {
        setInteracted(false);
      }
    };

    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  });

  let btnclass = (unsavedChanges)? 'cantdo' : (saved)? 'prefer' : 'indiff';
  let background = {
    background: (unsavedChanges)?
      `repeating-linear-gradient(225deg,red,red 8px,black 8px,black 10px,transparent 10px,transparent)`
      : (saved)?
      `repeating-linear-gradient(225deg,green,green 8px,black 8px,black 10px,transparent 10px,transparent)`
      : 
      'transparent'
  };

  let title = (unsavedChanges)?
    'This section has unsaved changes'
    : (saved)?
    'This section has changes that will be saved'
    : 
    `${course_instance.course_number}-${course_instance.section_number}`;
  if (background.background === undefined) console.error('Color not defined for:', JSON.stringify(course_instance))

  return (
    <div ref={ref} className={`block ${interacted? 'interacted' : 'grow-h'}`} onClick={() => setInteracted(true)}
      title={title} 
      style={{background: blockColors.get(course_instance.course_number)!, ...isVisible}}
    >
      <div className="hat-container" style={{
        ...background, 
        height: '15px',
        position: 'absolute',
        border: '0',
        zIndex: '-1'
      }}/>  
      { interacted? 
        <div className="pref-pane">
          <div className="pref-pane-title">Edit {course_instance.department} {course_instance.course_number} section {course_instance.section_number}</div>
          <div className='ms5' style={{display: 'flex'}}>
            Desired Peer Teachers: &nbsp;
            <input className="fill" type='number' value={desiredPTCount} onChange={e => handleChange(e, setDesiredPTCount, +e.currentTarget.value)} style={{width: '3em'}}/>
          </div>
          <div className='ms5' style={{display: 'flex'}}>
            Professor: &nbsp;
            <input className="fill" type='text' value={prof} onChange={e => handleChange(e, setProf, e.currentTarget.value)}/>
          </div>
          <div className="m5"/>
          <button request-type="request" className={`submit-button ${btnclass}`} onClick={registerUpdate}>Update section</button>
        </div>
        :
        <>
          <div className="fill"/>
          <div className={`block-text ${visible? '' : 'hidden'}`}>
            {course_instance.course_number} {course_instance.section_number}
          </div>
          <div className={`vstack block-detail ${visible? '' : 'hidden'}`}>
            <div>
              <span>{course_instance.department} {course_instance.course_number}-{course_instance.section_number}&nbsp;</span>
              <span>{formatDate(course_instance.start_time)}-{formatDate(course_instance.end_time)}</span>
            </div>
            <div>
              {course_instance.place}
            </div>
          </div>
        </>
      }
    </div>
  )
}
