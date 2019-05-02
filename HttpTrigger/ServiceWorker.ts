import {Context, HttpRequest} from '@azure/functions';
import {SQLRepository} from '../Lib/sqlRepository';
import * as _ from 'lodash';

let sqlRepository: SQLRepository;
class ServiceWorker {
  constructor() {}

  async Process(context: Context, req: HttpRequest): Promise<any> {
    //No check for time being
    // if (req.headers["x-hub-signature"] == undefined || req.headers["x-github-delivery"] == undefined ||
    //     req.headers["x-github-event"] == undefined) {
    //     return (
    //         context.res = {
    //             status: 400,
    //             body: "Ayyoo Amaa"
    //         });
    // }

    try {
      const action = _.get(req.body, 'action');
      if (action === 'labeled' || action === 'synchronize') {
        context.res = {
          status: 200,
          body: 'Forbidden from hook',
        };
        console.log (context.res) ;
        return context;
      }

      if (!sqlRepository) {
        sqlRepository = new SQLRepository(req);
      }

      const url = _.get(req.body, 'pull_request.url');
      const obj = _.set(req.body, 'pullid', url);

      if (!req.query.pagesize) {
        req.query.pagesize = '10';
      }
      if (!req.query.page) {
        req.query.page = '1';
      }

      if (req.query.pagesize === '0') {
        req.query.pagesize = '10';
      }

      if (req.query.page === '0') {
        req.query.page = '1';
      }

      if (req.method === 'GET') {
        if (req.query.q.toLowerCase().indexOf('delete') === -1) {
          return await this.getItem(context, decodeURI(req.query.q), parseInt(req.query.page), parseInt(req.query.pagesize));
        } else {
          context.res = {
            status: 400,
            body: 'He he he ',
          };
          console.log(context);
        }
      }

      if (req.method === 'POST') {
        return await this.setItem(context, req, obj);
      }
    } catch (err) {
      return err;
    }
  }

  private async setItem(context: Context, req: HttpRequest, obj: any) {
    if (!sqlRepository) {
      sqlRepository = new SQLRepository(req);
    }
    let result = await sqlRepository.setItem();
    context.res = {
      status: 200,
      body: result,
    };
    return context;
  }

  private async getItem(context: Context, query: string, page: number, pageSize: number) {
    if (sqlRepository === undefined) {
      sqlRepository = new SQLRepository(null);
    }
    let result = await sqlRepository.getItem(query, page, pageSize);
    context.res = {
      status: 200,
      body: result.toString(),
    };
    return result;
  }
}

export {ServiceWorker};
