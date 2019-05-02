// tslint:disable:no-any
// tslint:disable:no-invalid-this


import {Context as FunctionContext} from '@azure/functions';
import {HttpRequest} from '@azure/functions';
import {ServiceWorker} from '../HttpTrigger/ServiceWorker';
import {expect} from 'chai';
import {Context as MochaContext} from 'mocha';
import {doesNotReject} from 'assert';
import {Observable, of, Subject} from 'rxjs';
import * as jsonBadData from './Sample.data.json';
import {SQLRepository} from '../Lib/sqlRepository';
import * as jsonGoodData from './Sample.data.json';
/* const word = (<any>jsonBadData).name; */



describe('Insert PullRequestDetails - GoodData', () => {
  it('should return rowsAffected', async () => {
    let serviceWorker = new ServiceWorker();

    let context: any = {
      body: '',
      res: {
        status: 0,
        body: '',
      },
    };

    let req: any = {
      body: jsonGoodData,
      method: 'POST',
      query: {
        q: '',
        page: 1,
        pagesize: 1,
      },
    };

    let sqlRepositoy = new SQLRepository(req);
    await sqlRepositoy.savePullRequestDetail().then(result => {
      expect(result).to.eq(1);
    });
  });
});

//Action: synchronize is not accepted
describe('Insert PullRequestDetails - BadData', () => {
  it('should return 200 with body saying forbidden', async () => {
    let serviceWorker = new ServiceWorker();

    let context: any = {
      body: '',
      res: {
        status: 0,
        body: '',
      },
    };

    let req: any = {
      body: jsonBadData,
      method: 'POST',
      query: {
        q: '',
        page: 1,
        pagesize: 1,
      },
    };

    const result = await serviceWorker.Process(context, req);
    expect(result.res.status).to.eq(200);
    expect(result.res.body).to.eq('Forbidden');
  });
});

describe('Testing Post serviceWorker', () => {
  it.only('should return 200 with body saying ok', async () => {
    let serviceWorker = new ServiceWorker();

    let context: any = {
      body: '',
      res: {
        status: 0,
        body: '',
      },
    };

    let req: any = {
      body: jsonGoodData,
      method: 'POST',
      query: {
        q: '',
        page: 1,
        pagesize: 1,
      },
    };

    await serviceWorker.Process(context, req).then(data => {
      expect(data.res.body.first.rowsAffected.length).to.eq(1);
    //  expect(data.res.body.b).to.eq(1);
    });
  });
});
