import jwt from 'jsonwebtoken'

export const verifyToken = (request, response, next) => {
    try {
        console.log("Auth Headers:", request.headers);
        console.log("Auth Cookies:", request.cookies);
        
        // Check multiple sources for the token
        let token = null;
        
        // 1. Try to get from cookies
        if (request.cookies?.jwt) {
            token = request.cookies.jwt;
            console.log("Token found in cookies");
        } 
        // 2. Try to get from Authorization header
        else if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
            token = request.headers.authorization.split(' ')[1];
            console.log("Token found in Authorization header");
        }
        // 3. Try to get from custom header
        else if (request.headers['x-auth-token']) {
            token = request.headers['x-auth-token'];
            console.log("Token found in x-auth-token header");
        }
        // 4. Try query parameter as last resort
        else if (request.query?.token) {
            token = request.query.token;
            console.log("Token found in query parameter");
        }
        
        console.log("Final JWT token:", token ? token.substring(0, 10) + "..." : "No token found");

        if (!token) {
            console.log("No token found in any source");
            return response.status(401).send("You are not authenticated!");
        }

        jwt.verify(token, process.env.JWT_KEY, (err, payload) => {
            if (err) {
                console.log("Token verification error:", err);
                return response.status(403).send("Token is not valid!");
            }

            console.log("Token verified successfully. Payload:", payload);
            request.userId = payload.userId;
            next();
        });
    } catch (error) {
        console.error("Auth middleware error:", error);
        return response.status(500).send("Authentication error");
    }
};