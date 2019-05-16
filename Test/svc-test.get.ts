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
import * as jsonGoodData from './dataFlawed.json';
/* const word = (<any>jsonBadData).name; */
describe('Testing Get from serviceWorker', () => {
  it('should resturn number greater than zero', async () => {
    let serviceWorker = new ServiceWorker();

    let PageSize = 10;
    let req: any = {
      body: jsonGoodData,
      method: 'GET',
      query: {
        q: 'select * from PullRequestDetails',
        page: 1,
        pagesize: 10,
      },
    };

    let context: any = {
      body: '',
      res: {
        status: 0,
        body: '',
      },
    };

    serviceWorker.Process(context, req).then((result: any) => {
      expect(result.length).to.greaterThan(0);
    });
  });
});

describe('Test sqlRepository', () => {
  it('should resturn sqlRepository', () => {
    let req: any = {
      body: jsonGoodData,
      method: 'POST',
      query: {
        q: '',
        page: 1,
        pagesize: 1,
      },
    };

    const result = new SQLRepository();
    expect(result).to.instanceOf(SQLRepository, 'SQLRepository worked!');
  });
});
