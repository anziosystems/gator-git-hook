// tslint:disable:no-any
// tslint:disable:no-invalid-this

import {ServiceWorker} from '../HttpTrigger/ServiceWorker';
import {expect} from 'chai';
import {Context as MochaContext} from 'mocha';
import {doesNotReject} from 'assert';
import {Observable, of, Subject} from 'rxjs';
import * as jsonBadData from './Sample.data.json';
import {SQLRepository} from '../Lib/sqlRepository';
import * as jsonGoodData from './action-opened.json';
import * as commitData from './commit.data.json';
/* const word = (<any>jsonBadData).name; */

describe('Insert a Commit - Direct SQL', () => {
  it('should return rowsAffected', async () => {
    let serviceWorker = new ServiceWorker();

    let req: any = {
      body: commitData,
      method: 'POST',
      query: {
        q: '',
        page: 1,
        pagesize: 1,
      },
    };

    let sqlRepositoy = new SQLRepository();
    await sqlRepositoy.savePullRequestDetail(req).then(result => {
      expect(result.rowsAffected.length).to.eq(1);
    });
  });
});

describe('Insert a Commit - Process', () => {
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
      body: commitData,
      method: 'POST',
      query: {
        q: '',
        page: 1,
        pagesize: 1,
      },
    };

    const result = await serviceWorker.Process(context, req);
    expect(result.res.status).to.eq(200);
  });
});

describe('Insert PullRequestDetails - GoodData - SQL Repository', () => {
  it('should return rowsAffected', async () => {
    let serviceWorker = new ServiceWorker();
    let req: any = {
      body: jsonGoodData,
      method: 'POST',
      query: {
        q: '',
        page: 1,
        pagesize: 1,
      },
    };

    let sqlRepositoy = new SQLRepository();
    await sqlRepositoy.savePullRequestDetail(req).then(result => {
      expect(result.rowsAffected.length).to.eq(1);
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
  });
});

describe('Testing Post serviceWorker', () => {
  it('should return 200 with body saying ok', async () => {
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
      expect(data.res.body.status).to.eq(200);
      //  expect(data.res.body.b).to.eq(1);
    });
  });
});
