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
      if (_.isNil(req.body)) {
        context.res = {
          status: 406,
          body: 'request does not have a body',
        };
        console.log(context.res);
        return context;
      }
      
      let payload: any;
      if (typeof (req.body) === 'object'){
        payload = req.body;
        console.log ('==>body is a json object')
      }  else {
      //Payload = {} is appended by Git hub  
        payload = JSON.parse(decodeURIComponent(req.body));
        if (payload.substr(0, 8) === 'payload=') 
            payload = JSON.parse (req.body.substr(8));
        console.log ('==>JSON Parser ran. Payload= is removed');
      }

      let action: string = _.get(payload, 'action');

      if (action == undefined) {
        action = 'commit';
        //if no action
        let action2: any = _.get(payload, 'commits');
        if (action2 == undefined) {
          //not acceptable
          context.res = {
            status: 406,
            body: 'No Commit node found!',
          };
          console.log(context.res);
          return context;
        } else {
          let login: string = _.get(payload, 'head_commit.author.username');
          if (login == undefined) {
            login = _.get(payload, 'head_commit.author.name');
          }
          if (login == undefined) {
            context.res = {
              status: 406,
              body: 'No login defined.',
            };
            console.log(context.res);
            return context;
          }
          if (login.startsWith('greenkeeper', 0) || login.startsWith('semantic-release-bot', 0)) {
            context.res = {
              status: 406,
              body: 'greenkeeper, semantic-release-bot and bots are not intresting',
            };
            console.log(context.res);
            return context;
          }
        }
        
      }

      action = action.toLowerCase();
      if (action === 'opened' || action === 'closed' || action === 'open' || 
          action === 'close' || action === 'edited' || action === 'commit') {
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

      if (req.method === 'POST') {
        return await this.setItem(context, payload);
      }
    } catch (err) {
      return err;
    }
  }

  private async setItem(context: Context, payload: any) {
    try {
      if (!sqlRepository) {
        sqlRepository = new SQLRepository();
      }
      const result = await sqlRepository.savePullRequestDetail(payload);
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
  }
}

export {ServiceWorker};
