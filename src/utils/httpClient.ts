import axios from "axios";

const request = axios.create({
    proxy: false,
    timeout: 120000,
});

export const httpClient = request;;