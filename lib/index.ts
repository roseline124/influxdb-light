import { RequestPayload } from "../model/storage";
import { OptionsSchema, RequestSchema } from "../model/request";
import { post, toInfluxFormat, get } from "./web";
import { toBase64 } from "./util";
import { QueryV1Response } from "../model/query";

export class InfluxDB {
    private request: RequestSchema;
    constructor(request: RequestSchema) {
        this.request = request;
    }

    /**
     * To write points to v1 db.
     * @param payload : RequestPayload
     * @param db : string
     * @returns : Promise<any>
     */
    writeV1(payload: RequestPayload, db: string) : Promise<any> {
        let options: OptionsSchema = { ...this.request, ...{ path: `/write?db=${db}` } };
        options = { ...options, headers: this.setHeaders("text/plain") };
        return post<String>(options, toInfluxFormat(payload));
    }

    /**
     * To write points V2 db.
     * @param payload 
     * @param org 
     * @param bucket 
     * @returns : Promise<any>
     */
    writeV2(payload: RequestPayload, org: string, bucket: string) : Promise<any> {
        let options: OptionsSchema = { ...this.request, ...{ path: `/api/v2/write?org=${org}&bucket=${bucket}` } };
        options = { ...options, headers: this.setHeaders("text/plain") };
        return post<String>(options, toInfluxFormat(payload));
    }


    /**
     * Get records from InfluxDB >V1.0
     * @param db : string
     * @param influxQuery : string (accepts influxQuery(SQL style)) 
     * @returns : Promise<any>
     */
    queryV1(db: string, influxQuery: string) : Promise<any> {
        let options: OptionsSchema = { ...this.request, ...{ path: `/query?db=${db}&q=${influxQuery}` } };
        options = { ...options, headers: this.setHeaders() };
        return new Promise((resolve, reject) => {
            get<QueryV1Response>(options)
                .then((result: QueryV1Response) => {
                    if(result.results.length && result.results[0].series.length) {
                        resolve(result.results);
                    } else {
                        resolve([]);
                    }
                }).catch(error => {
                    reject(error);
                });
        })
    }

    /**
     * Get records from InfluxDB V2.0
     * @param org : string
     * @param fluxQuery : string (accepts flux query only)
     * @returns Promise<any>
     */
    queryV2(org: string, fluxQuery: string) : Promise<any> {
        let options: OptionsSchema = { ...this.request, ...{ path: `/api/v2/query?org=${org}` } };
        options = { ...options, headers: this.setHeaders("application/vnd.flux") };
        return post<String>(options, fluxQuery)
    }

    private setHeaders(contentType?: string) {
        let headers: object = this.request.username && this.request.password 
            ? { "Authorization": `Basic ${toBase64(this.request.username + ":" + this.request.password)}` }
            : this.request.token
            ? { "Authorization": `Token ${this.request.token}` }
            : {};
        headers = contentType ? { ...headers, "Content-Type": contentType } : headers;
        return headers;
    }
}
