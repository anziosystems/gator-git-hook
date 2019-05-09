let sql = require('mssql');
import {sqlConfigSetting} from './sqlConfig';
import * as _ from 'lodash';

class PullRequest {
  Id: string;
  Org: string;
  Repo: string;
  Url: string;
  State: string;
  Title: string;
  Created_At: string;
  Body: string;
  Login: string;
  Avatar_Url: string;
  User_Url: string;
}

class SQLRepository {
  pr: PullRequest;
  raw: string;
  pool: any;

  constructor(obj: any) {
    //for get there may not be any obj
    if (obj) {
      this.pr = this.shredObject(obj);
      this.raw = obj.body;
    }
    this.createPool();
  }

  async createPool() {
    if (!this.pool) {
      await new sql.ConnectionPool(sqlConfigSetting).connect().then((pool: any) => {
        this.pool = pool;
      });
    }
  }
  
  async savePullRequestDetail(): Promise<any> {
    try {
      await this.createPool();
    //  let values = `'${this.pr.Org}', '${this.pr.Login}','${this.pr.Action}','${this.pr.PullRequestId}','${this.pr.PullRequestUrl}','${this.pr.State}','${this.pr.Avatar_Url}','${this.pr.User_Url}','${this.pr.Created_At}','${this.pr.Body}','${this.pr.Teams_Url}','${this.pr.Repo_Name}','${this.pr.Repo_FullName}','${this.pr.Repo_Description}','${this.pr.Links}','${this.pr.PullId}','${this.pr.Title}' `;
      const request = await this.pool.request();
      if(!this.pr.Body) {
        this.pr.Body = " ";
      }

      if(this.pr.Body.length > 1999) {
        this.pr.Body = this.pr.Body.substr(0,1999);
      }
      
      request.input('Id', sql.VarChar(200), this.pr.Id);
      request.input('Org', sql.VarChar(1000), this.pr.Org);
      request.input('Repo', sql.VarChar(1000), this.pr.Repo);
      request.input('Url', sql.VarChar(1000), this.pr.Url);
      request.input('State', sql.VarChar(50), this.pr.State);
      request.input('Title', sql.VarChar(5000), this.pr.Title);
      request.input('Created_At', sql.VarChar(20), this.pr.Created_At);
      request.input('Body', sql.VarChar(2000), this.pr.Body);
      request.input('Login', sql.VarChar(100), this.pr.Login);
      request.input('Avatar_Url', sql.VarChar(2000), this.pr.Avatar_Url);
      request.input('User_Url', sql.VarChar(2000), this.pr.User_Url);
      try {
        let x =  await request.execute('SavePR4Repo');
        return x;
      } catch (ex) {
        console.log(ex);
      }
    } catch (err) {
        if (err.number === 2601) {
            console.log('savePullRequestDetail: ' + err); //Duplicate Record
        }
      console.log(err);
    }
  };

  private shredObject(obj: any): PullRequest {
    let pr: PullRequest = new PullRequest();

    try {
      pr.Id = _.get(obj.body, 'pull_request.node_id');
      pr.Org = _.get(obj.body, 'pull_request.base.repo.owner.login');
      pr.Repo = _.get(obj.body, 'pull_request.base.repo.name');
      pr.Url = _.get(obj.body, 'pull_request.url');
      pr.Login = _.get(obj.body, 'pull_request.user.login');
      pr.Title = _.get(obj.body, 'pull_request.title');
      pr.State = _.get(obj.body, 'pull_request.action');
      pr.Avatar_Url = _.get(obj.body, 'pull_request.user.avatar_url');
      pr.User_Url = _.get(obj.body, 'pull_request.user.url');
      pr.Created_At = _.get(obj.body, 'pull_request.created_at');
      pr.Body = _.get(obj.body, 'pull_request.body');
    
    } catch (err) {
      console.log(err);
    }

    return pr;
  }

  async setItem() {
    try {
      const first = await this.savePullRequestDetail();
      return {first};
    } catch (err) {
      console.log(err);
    }
  }

  async getItem(query: string, page: number, pageSize: number) {
    try {
      await this.createPool();
      const request = await this.pool.request();
      const rs = await request.query(query);
      let results = rs.recordset;
      if (isNaN(page)) {
        page = 1;
      }
      if (page === 0) {
        page = 1;
      }
      if (isNaN(pageSize)) {
        pageSize = 10;
      }
      if (pageSize === 0) {
        pageSize = 10;
      }

      let s: string = '[';
      let ctr: number = 0;
      let startCtr: number = (page - 1) * pageSize;
      if (startCtr === 0) {
        startCtr = 1;
      }
      let endCtr: number = page * pageSize;

      if (endCtr > results.length) {
        endCtr = results.length;
      }

      for (let result of results) {
        ctr = ctr + 1;
        if (ctr >= startCtr && ctr <= endCtr) {
          s = s + JSON.stringify(result);
          if (ctr < endCtr) {
            s = s + ','; //last element does not need the comma
          }
        }
      }
      s = s + ']';
      return s;
    } catch (err) {
      console.log(err);
    }
  }

}

export {SQLRepository};
