// tslint:disable:no-any
// tslint:disable:no-invalid-this

import {AzureFunction, Context, HttpRequest} from '@azure/functions';
import {ServiceWorker} from './ServiceWorker';

const httpTrigger: AzureFunction = async function(context: Context, req: HttpRequest) {
  if (this.serviceWorker === undefined) {
    this.serviceWorker = new ServiceWorker();
  }
  return await this.serviceWorker.Process(context, req);
};

export default httpTrigger;
