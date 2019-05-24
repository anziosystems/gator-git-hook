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
        if (_.isNil(req.body)){
        context.res = {
          status: 406, 
          body: 'request does not have a body',
        };
        console.log(context.res);
        return context;
      }

      
      let action: string = _.get(req.body, 'action');
      
      if (action == undefined) {
        //if no action
        let action2: any = _.get(req.body, 'commits');
        if ( action2 == undefined) {
          //not acceptable 
          context.res = {
            status: 406, 
            body: 'No Commit node found!' ,
          };
          console.log(context.res);
          return context;
        } else {
          let login: string = _.get(req.body, 'head_commit.author.username');
          if (login == undefined) {
            context.res = {
              status: 406, 
              body: 'No login defined.',
            };
            console.log(context.res);
            return context;
          }
          if (login.startsWith('greenkeeper', 0) || login.indexOf('[bot]', 0) === -1){
            context.res = {
              status: 406, 
              body: 'greenkeeper and bots are not intresting',
            };
            console.log(context.res);
            return context;
          }
        }
        action = 'commit';
      }

      action = action.toLowerCase();
      if (action === 'opened' || action === 'closed' || action === 'open' || action === 'close' || action === 'edited' || action === 'commit') {
        //do nothing - means save this PR in SQL
      } else {
        context.res = {
          status: 406,
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
        status: 400,
        body: ex,
      };
      return context;
    }
    return context;
  }
}

export {ServiceWorker};
