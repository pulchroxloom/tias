package com.tias.app;

import java.sql.*;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.amazonaws.services.lambda.runtime.events.SQSEvent.SQSMessage;

import software.amazon.awssdk.services.lambda.model.GetAccountSettingsRequest;
import software.amazon.awssdk.services.lambda.model.GetAccountSettingsResponse;
import software.amazon.awssdk.services.lambda.model.ServiceException;
import software.amazon.awssdk.services.lambda.LambdaAsyncClient;
import software.amazon.awssdk.services.lambda.model.AccountUsage;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.StringBuilder;
import java.util.concurrent.CompletableFuture;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.PriorityQueue;
import java.util.Properties;
import java.util.stream.Collectors;

import db.Availability;
import db.Course;
import db.Meeting;
import db.Person;
import db.Preference;
import db.Qualification;
import db.Section;

// https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html
public class Handler implements RequestHandler<SQSEvent, String> {
    static Connection conn;

    static HashMap<Integer, Person> people;
    static HashMap<Integer, Course> courses;
    static HashMap<Integer, Section> sections;
    static HashMap<Integer /* section id */, ArrayList<Integer> /* person id */> schedule;

    private static final Logger logger = LoggerFactory.getLogger(Handler.class);
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private static final LambdaAsyncClient lambdaClient = LambdaAsyncClient.create();

    // https://github.com/awsdocs/aws-lambda-developer-guide/blob/main/sample-apps/java-basic/src/main/java/example/Handler.java
    @Override
    public String handleRequest(SQSEvent event, Context context)
    {
        String response = new String();
        // call Lambda API
        logger.info("Getting account settings");
        CompletableFuture<GetAccountSettingsResponse> accountSettings = 
            lambdaClient.getAccountSettings(GetAccountSettingsRequest.builder().build());
        // log execution details
        logger.info("ENVIRONMENT VARIABLES: {}", gson.toJson(System.getenv()));
        logger.info("CONTEXT: {}", gson.toJson(context));
        logger.info("EVENT: {}", gson.toJson(event));
        // process event
        for(SQSMessage msg : event.getRecords()){
            logger.info(msg.getBody());
        }
        // process Lambda API response
        try {
            GetAccountSettingsResponse settings = accountSettings.get();
            response = gson.toJson(settings.accountUsage());
            logger.info("Account usage: {}", response);
        } catch(Exception e) {
            e.getStackTrace();
        }
        return response;
    }

    public static void generateSchedule() throws SQLException {
        // https://jdbc.postgresql.org/documentation/head/index.html
        String url = "jdbc:postgresql://localhost/postgres"; // TODO: Set values in Parameter Store
        Properties props = new Properties();
        props.setProperty("user","postgres"); // TODO: Set values in Parameter Store
        props.setProperty("password","admin"); // TODO: Set values in Parameter Store
        try {
            conn = DriverManager.getConnection(url, props);
        } catch (Exception e) {
            System.err.println("Unable to connect to the Database:\n\t" + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }

        people = new HashMap<Integer, Person>();
        courses = new HashMap<Integer, Course>();
        sections = new HashMap<Integer, Section>();
        schedule = new HashMap<Integer, ArrayList<Integer>>();

        getCourses();
        courses.forEach((key, value) -> {
            System.out.println(key + "\t" + value);
        });
        // TODO: Get list of Person IDs programmatically
        // getPeople(new int[]{3, 5});
        getPeople();
        people.forEach((key, value) -> {
            System.out.println(key + "\t" + value);
        });
        getSections();
        sections.forEach((key, value) -> {
            System.out.println(key + "\t" + value);
        });

        for (int i = 0; i < 10; ++i) System.out.println();
        schedulePeopleToSections();
        schedule.forEach((key, value) -> {
            System.out.println(key + "\t" + value);
        });
    }

    // public static void getTypeMapping() throws SQLException {
    //     var rs = conn.getMetaData().getTypeInfo();
    //     while (rs.next())
    //         System.out.println(rs.getString("TYPE_NAME") + "\t" + JDBCType.valueOf(rs.getInt("DATA_TYPE")).getName());
    // }

    static void getCourses() throws SQLException {
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT * FROM course");
        while (rs.next())
        {
            courses.put(rs.getInt("course_id"), new Course(rs.getString("department"), rs.getString("course_number"), rs.getString("course_name")));
        }
        rs.close();
        st.close();
    }

    static String constructPersonQuery(String table, int numPeople) {
        StringBuilder sb = new StringBuilder()
            .append("SELECT *")
            .append("FROM ")
            .append(table)
            .append(' ')
            .append("WHERE person_id IN (");
            for (int i = 0; i < numPeople - 1; ++i) {
                sb.append("?, ");
            }
            sb.append("?)");
            return sb.toString();
    }

    static void getPeople(int[] peopleIds) throws SQLException {
        System.out.println(constructPersonQuery("person", peopleIds.length));
        PreparedStatement st = conn.prepareStatement(constructPersonQuery("person", peopleIds.length));

        for (int i = 0; i < peopleIds.length; ++i) {
            st.setInt(i + 1, peopleIds[i]);
        }

        ResultSet rs = st.executeQuery();

        while (rs.next())
        {
            people.put(rs.getInt("person_id"), new Person(rs.getInt("person_id"), rs.getString("email"), rs.getString("first_name"), rs.getString("last_name"), rs.getInt("desired_number_assignments"), rs.getBoolean("peer_teacher"), rs.getBoolean("teaching_assistant"), rs.getBoolean("administrator"), rs.getBoolean("professor")));
        }

        rs.close();
        st.close();

        st = conn.prepareStatement(constructPersonQuery("person_availability", peopleIds.length));

        for (int i = 0; i < peopleIds.length; ++i) {
            st.setInt(i + 1, peopleIds[i]);
        }

        rs = st.executeQuery();

        while (rs.next())
        {
            people.get(rs.getInt("person_id")).addAvailability(new Availability(rs.getString("weekday"), rs.getTime("start_time"), rs.getTime("end_time")));
        }

        rs.close();
        st.close();

        st = conn.prepareStatement(constructPersonQuery("section_assignment_preference", peopleIds.length));

        for (int i = 0; i < peopleIds.length; ++i) {
            st.setInt(i + 1, peopleIds[i]);
        }

        rs = st.executeQuery();

        while (rs.next())
        {
            people.get(rs.getInt("person_id")).addPreference(new Preference(rs.getInt("section_id"), rs.getString("preference")));
        }

        rs.close();
        st.close();

        st = conn.prepareStatement(constructPersonQuery("qualification", peopleIds.length));

        for (int i = 0; i < peopleIds.length; ++i) {
            st.setInt(i + 1, peopleIds[i]);
        }

        rs = st.executeQuery();

        while (rs.next())
        {
            boolean qualified = rs.getBoolean("qualified");
            people.get(rs.getInt("person_id")).addQualification(new Qualification(rs.getInt("course_id"), qualified));
        }

        rs.close();
        st.close();
    }

    static String constructPersonQuery(String table) {
        StringBuilder sb = new StringBuilder()
            .append("SELECT *")
            .append("FROM ")
            .append(table);
            return sb.toString();
    }

    static void getPeople() throws SQLException {
        System.out.println(constructPersonQuery("person"));
        Statement st = conn.createStatement();

        ResultSet rs = st.executeQuery(constructPersonQuery("person"));

        while (rs.next())
        {
            people.put(rs.getInt("person_id"), new Person(rs.getInt("person_id"), rs.getString("email"), rs.getString("first_name"), rs.getString("last_name"), rs.getInt("desired_number_assignments"), rs.getBoolean("peer_teacher"), rs.getBoolean("teaching_assistant"), rs.getBoolean("administrator"), rs.getBoolean("professor")));
        }

        rs.close();
        st.close();

        st = conn.createStatement();

        rs = st.executeQuery(constructPersonQuery("person_availability"));

        while (rs.next())
        {
            people.get(rs.getInt("person_id")).addAvailability(new Availability(rs.getString("weekday"), rs.getTime("start_time"), rs.getTime("end_time")));
        }

        rs.close();
        st.close();

        st = conn.createStatement();

        rs = st.executeQuery(constructPersonQuery("section_assignment_preference"));

        while (rs.next())
        {
            people.get(rs.getInt("person_id")).addPreference(new Preference(rs.getInt("section_id"), rs.getString("preference")));
        }

        for (Person person : people.values()) {
            person.sortPreferences();
        }

        rs.close();
        st.close();

        st = conn.createStatement();

        rs = st.executeQuery(constructPersonQuery("qualification"));

        while (rs.next())
        {
            boolean qualified = rs.getBoolean("qualified");
            people.get(rs.getInt("person_id")).addQualification(new Qualification(rs.getInt("course_id"), qualified));
        }

        rs.close();
        st.close();
    }

    static void getSections() throws SQLException {
        Statement st = conn.createStatement();
        ResultSet rs = st.executeQuery("SELECT * FROM course_section");
        while (rs.next())
        {
            sections.put(rs.getInt("section_id"), new Section(rs.getInt("course_id"), rs.getString("section_number"), rs.getInt("capacity_peer_teachers"), rs.getInt("capacity_teaching_assistants")));
        }
        rs.close();
        st.close();

        st = conn.createStatement();
        rs = st.executeQuery("SELECT * FROM section_meeting WHERE meeting_type='Laboratory'");
        while (rs.next())
        {
            sections.get(rs.getInt("section_id")).addMeeting(new Meeting(rs.getString("weekday"), rs.getTime("start_time"), rs.getTime("end_time"), rs.getString("place"), rs.getString("meeting_type")));
        }
        rs.close();
        st.close();
    }

    static void schedulePeopleToSections() {
        people.forEach((person_id, person) -> {
            person.computeAvailabilityScore(sections);
        });

        PriorityQueue<Person> queue = new PriorityQueue<>(people.values());

        while (!queue.isEmpty()) {
            Person frontPerson = queue.remove();

            HashSet<Integer> possibleSections = new HashSet<>();
            possibleSections.addAll(
                sections.keySet().stream()
                    .filter(sectionId ->  frontPerson.isGoodSection(sectionId, sections.get(sectionId)))
                    .collect(Collectors.toSet())
            );

            HashSet<Integer> badSections = new HashSet<>();

            // Schedule what you prefer or marked indifferent
            for (Preference preference : frontPerson.getPreferences()) {
                if (frontPerson.getCurrentAssignments() >= frontPerson.getDesiredNumberAssignments()) break;
                if (!possibleSections.contains(preference.getSectionId())) continue;
                if (preference.isPreferable()) {
                    Section section = sections.get(preference.getSectionId());
                    if (section.getAssignedPTs() < section.getCapacityPTs()) {
                        section.addAssignedPTs();
                        frontPerson.addCurrentAssignment();
                        schedule.putIfAbsent(preference.getSectionId(), new ArrayList<>());
                        schedule.get(preference.getSectionId()).add(frontPerson.getPersonId());
                    }
                } else {
                    badSections.add(preference.getSectionId());
                }
                possibleSections.remove(preference.getSectionId());
            }

            // Schedule what you didn't mark at all
            if (frontPerson.getCurrentAssignments() < frontPerson.getDesiredNumberAssignments()) {
                for (int sectionId : possibleSections) {
                    if (frontPerson.getCurrentAssignments() >= frontPerson.getDesiredNumberAssignments()) break;
                    Section section = sections.get(sectionId);
                    if (section.getAssignedPTs() < section.getCapacityPTs()) {
                        section.addAssignedPTs();
                        frontPerson.addCurrentAssignment();
                        schedule.putIfAbsent(sectionId, new ArrayList<>());
                        schedule.get(sectionId).add(frontPerson.getPersonId());
                    }
                }
            }

            // Schedule what you marked as not preferred
            if (frontPerson.getCurrentAssignments() < frontPerson.getDesiredNumberAssignments()) {
                for (int sectionId : badSections) {
                    if (frontPerson.getCurrentAssignments() >= frontPerson.getDesiredNumberAssignments()) break;
                    Section section = sections.get(sectionId);
                    if (section.getAssignedPTs() < section.getCapacityPTs()) {
                        section.addAssignedPTs();
                        frontPerson.addCurrentAssignment();
                        schedule.putIfAbsent(sectionId, new ArrayList<>());
                        schedule.get(sectionId).add(frontPerson.getPersonId());
                    }
                }
            }

            if (frontPerson.getCurrentAssignments() == 0) {
                System.out.println("Failed to Schedule:\n" + frontPerson);
            }

            // At this stage you are either satisfied or you cannot be fully satisfied because there aren't enough available, qualified labs that you can do that fulfill the number of desired labs. This is an extremely unlikely occurrence.
        }
    }
}