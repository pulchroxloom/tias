const helper_functions = require("./helper_functions");

exports.handler = async (event) => {
    let userId = event?.pathParameters?.userId;
    
    let dbQuery = `SELECT section_id, preference
                   FROM section_assignment_preference 
                   WHERE person_id = $1
                   ORDER BY section_id`;
    let params = [userId];
    
    let dbRows = await helper_functions.queryDB(dbQuery, params);
    
    const responseBody = {
        "preferences": dbRows
    };

    const response = {
        "isBase64Encoded": false,
        "statusCode": 200,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "http://localhost:3000" },
        "body": JSON.stringify(responseBody)
    };

    return response;
};