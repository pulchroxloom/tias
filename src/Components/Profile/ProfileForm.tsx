import React, { useEffect } from 'react'
import { ProfileFormRow } from './ProfileFormRow'
import contexts from '../APIContext'
import { APIUserQualification, parseCookie } from '../../modules/API';

export const ProfileForm = () => {
  const [collapsed, setCollapsed] = React.useState<boolean>(false);

  let updateOnDismount = () => {};
  const submit = (event: any, setQuals: any) => {
    const selections = Array.from(document.querySelectorAll(`select[id$="-prefs"]`));
    let newQuals: APIUserQualification[] = [];
    let requestBody: any = {"qualifications": {}}
    selections.forEach((dropdown) => {
      const e = dropdown as HTMLSelectElement;
      newQuals.push({
        course_id: parseInt(e.getAttribute('for-cid')!),
        course_number: e.getAttribute('for-course')!,
        qualified: e.value === "true"
      })

      requestBody.qualifications[e.getAttribute('for-cid')!] = e.value === "true";
    })

    document.getElementById("submit-button")?.setAttribute('value', 'Saving...');
    fetch(`https://y7nswk9jq5.execute-api.us-east-1.amazonaws.com/prod/users/${parseCookie().tias_user_id}/qualifications`, {
      method: 'PUT',
      body: JSON.stringify(requestBody)
    }).then(response => response.json())
      .then(responseJSON => {
        if (responseJSON.message !== undefined && responseJSON.message.contains('error')) {
          document.getElementById("submit-button")?.setAttribute('value', 'Qualifiactions could not be saved.')
        } else {
          document.getElementById("submit-button")?.setAttribute('value', 'Qualifications Saved!');
          setQuals(newQuals);
        }
      })
      .catch(() => document.getElementById("submit-button")?.setAttribute('value', 'Qualifiactions could not be saved.'));

    event.preventDefault();
  }

  return (
    <div className={`profile-form ${collapsed? 'collapsed' : ''}`} >
      <div className={`hstack header ${collapsed? 'collapsed' : ''}`} onClick={() => setCollapsed(!collapsed)}>
        <div className="header-content">Course Qualifications</div>
        <div className="fill" />
        <div className="arrow-container">
          <div className={`arrow ${collapsed? 'left': 'down'}`} />
        </div>
      </div>

      < contexts.userQuals.Consumer >
        {([quals, setQuals]) => (
          <div className={`${collapsed? "collapsed " : ""}form-body`}>
            {/* <div className="abs-wrapper"> */}
              <div className="form-border">
                <form onSubmit={(e: any) => submit(e, setQuals)}>
                  <div className="scrollable">
                    { (quals.length > 0)? 
                      quals.map((qual: APIUserQualification, idx: number) => (
                        <ProfileFormRow course_id={qual.course_id} course_name={qual.course_number} qual={qual.qualified} key={`pfrow-${JSON.stringify(qual)}`}/>
                        ))
                        :
                        <ProfileFormRow course_id={-1} course_name={"none"} qual={false} key={`pfrow-none`}/>
                      }
                  </div>

                  <div className="hstack">
                    <input id="submit-button" type="submit" className="green button submit" value="Save Qualifications"/>
                  </div>
                </form>
              </div>
            {/* </div> */}
          </div>
        )}
      </contexts.userQuals.Consumer>
    </div>
  )
}
