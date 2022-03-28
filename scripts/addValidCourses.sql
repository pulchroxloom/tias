CREATE FUNCTION public."ValidCourses"(IN "P_person_id" integer)
    RETURNS table (course_id course.course_id%TYPE, department course.department%TYPE, course_number course.course_number%TYPE, course_name course.course_name%TYPE,
	section_id course_section.section_id%TYPE, section_number course_section.section_number%TYPE, placeholder_professor_name course_section.placeholder_professor_name%TYPE,
    preference section_assignment_preference.preference%TYPE,
	weekday section_meeting.weekday%TYPE, start_time section_meeting.start_time%TYPE, end_time section_meeting.end_time%TYPE, place section_meeting.place%TYPE,
	duration interval)
    LANGUAGE 'sql'
    
AS $BODY$
SELECT DISTINCT
	course.course_id, course.department, course.course_number, course.course_name,
	course_section.section_id, course_section.section_number, course_section.placeholder_professor_name,
    section_assignment_preference.preference,
	section_meeting.weekday, section_meeting.start_time, section_meeting.end_time, section_meeting.place,
	(section_meeting.end_time - section_meeting.start_time) AS duration
FROM person_availability
JOIN section_meeting ON
	person_availability.weekday = section_meeting.weekday
	AND person_availability.start_time < section_meeting.start_time
	AND person_availability.end_time > section_meeting.end_time
	AND section_meeting.meeting_type = 'Laboratory'
JOIN course_section ON
	course_section.section_id = section_meeting.section_id
JOIN qualification ON
	qualified = 'true' AND
	qualification.person_id = "P_person_id" AND
	qualification.course_id IN (SELECT course_section.course_id FROM course_section WHERE course_section.section_id = section_meeting.section_id)
JOIN course ON
	course.course_id = course_section.course_id
LEFT OUTER JOIN section_assignment_preference ON
	section_assignment_preference.person_id = "P_person_id" AND
	section_assignment_preference.section_id = section_meeting.section_id
WHERE person_availability.person_id = "P_person_id"
ORDER BY section_meeting.weekday, section_meeting.start_time, duration, course.department, course.course_number, course_section.section_number
$BODY$;