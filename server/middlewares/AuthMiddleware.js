import jwt from 'jsonwebtoken'

export const verifyToken = (request, response, next) => {
    try {
        console.log("Headers:", request.headers);
        const token = request.cookies?.jwt;
        console.log("Cookies received:", request.cookies); // Debug cookies
        console.log("JWT token:", token); // Debug token

        if (!token) {
            console.log("No token found in cookies");
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