import React, { FC, useContext, useState } from 'react'
import { Person } from '../../modules/API'
import contexts from '../APIContext'
import { Scrollable } from '../Misc/Scrollable'
import { EmployeeRow } from './EmployeeRow'
import { GenerateButton } from './GenerateButton'
import { LoadButton } from './LoadButton'
import { SaveButton } from './SaveButton'

interface Props {
  
}

export const EmployeeList: FC<Props> = () => {
  const sortLastAlg = ((a: Person, b: Person) => a.last_name.localeCompare(b.last_name));
  const sortFirstAlg = ((a: Person, b: Person) => a.first_name.localeCompare(b.first_name));
  const [employees, setEmployees] = useContext(contexts.employees);
  const genState = useState<boolean>(false);
  const notScheduled = employees.filter(e => e.isScheduled === false).length;

  const [sortLast, setSortLast] = useState<boolean>(true);

  return (
    <div className="vstack">
      <div className="header hstack mb0">
        <h2 className="slim">Peer Teachers</h2>
      </div>

      <div className="header-bar">
        <div className="hstack">
          <div className="element left">Sort By:</div>
          <div className="element center" onClick={() => setSortLast(false)}>First Name</div>
          <div className="element center" onClick={() => setSortLast(true)}>Last Name</div>
        </div>
      </div>

      {(notScheduled > 0 && !genState[0])? 
        <div className='header-bar'>
          <div className="slim unscheduled">{notScheduled} unscheduled peer teachers</div>
        </div>
        :
        <></>
      }


      {(employees.length > 0)?
          (employees[0].person_id !== -2)?
            < Scrollable >
              {employees.sort((sortLast)? sortLastAlg : sortFirstAlg).map((e: Person, index: number) => (
                < EmployeeRow employee={employees[index]} setEmployee={(e: Person) => {
                  employees[index] = e;
                  setEmployees(employees);
                }} key={`employee-row-${e.person_id}`} linkID={e.person_id} genState={genState} />
              ))}
            </Scrollable>
            :
            <div className="loading">An error occurred.</div>

        : <div className="loading">Loading...</div>
      }

      <div className="vstack top-border">
        < LoadButton />
        < GenerateButton genState={genState} />
        < SaveButton />
      </div>
    </div>
  )
}
