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
      let action: string = _.get(req.body, 'action');

      if (action === undefined) {
        //if no action

        action = _.get(req.body, 'commits');
        if (action === undefined) {
          context.res = {
            status: 200,
            body: 'Gator does not care - commit',
          };
          console.log(context.res);
          return context;
        }
        action = 'commit';
      }

      action = action.toLowerCase();
      if (action === 'opened' || action === 'closed' || action === 'open' || action === 'close' || action === 'edited' || action === 'commit') {
        //do nothing - means save this PR in SQL
      } else {
        context.res = {
          status: 200,
          body: 'Gator does not care. Action: ' + action,
        };
        console.log(context.res);
        return context;
      }

      if (!sqlRepository) {
        sqlRepository = new SQLRepository();
      }

      const url = _.get(req.body, 'pull_request.url');
      const obj = _.set(req.body, 'pullid', url);

      if (req.method === 'POST') {
        return await this.setItem(context, req, obj);
      }
    } catch (err) {
      return err;
    }
  }

  private async setItem(context: Context, req: HttpRequest, obj: any) {
    try {
      if (!sqlRepository) {
        sqlRepository = new SQLRepository();
      }
      let result = await sqlRepository.setItem(req);
      context.res = {
        status: 200,
        body: result,
      };
      return context;
    } catch (ex) {
      context.res = {
        status: 200,
        body: ex,
      };
      return context;
    }
    return context;
  }
}

export {ServiceWorker};
