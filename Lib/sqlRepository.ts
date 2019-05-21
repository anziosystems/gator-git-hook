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

  constructor() {
    this.createPool();
  }

  async createPool() {
    if (!this.pool) {
      await new sql.ConnectionPool(sqlConfigSetting).connect().then((pool: any) => {
        this.pool = pool;
      });
    }
  }

  async savePullRequestDetail(obj: any): Promise<any> {
    try {
      await this.createPool();
      //  let values = `'${this.pr.Org}', '${this.pr.Login}','${this.pr.Action}','${this.pr.PullRequestId}','${this.pr.PullRequestUrl}','${this.pr.State}','${this.pr.Avatar_Url}','${this.pr.User_Url}','${this.pr.Created_At}','${this.pr.Body}','${this.pr.Teams_Url}','${this.pr.Repo_Name}','${this.pr.Repo_FullName}','${this.pr.Repo_Description}','${this.pr.Links}','${this.pr.PullId}','${this.pr.Title}' `;
      const request = await this.pool.request();
      let pr: PullRequest = this.shredObject(obj);
      if (!pr.Body) {
        pr.Body = ' ';
      }

      if (pr.Body.length > 1999) {
        pr.Body = pr.Body.substr(0, 1999);
      }

      request.input('Id', sql.VarChar(200), pr.Id);
      request.input('Org', sql.VarChar(1000), pr.Org);
      request.input('Repo', sql.VarChar(1000), pr.Repo);
      request.input('Url', sql.VarChar(1000), pr.Url);
      request.input('State', sql.VarChar(50), pr.State);
      request.input('Title', sql.VarChar(5000), pr.Title);
      request.input('Created_At', sql.VarChar(20), pr.Created_At.substr(0,19));
      request.input('Body', sql.VarChar(2000), pr.Body);
      request.input('Login', sql.VarChar(100), pr.Login);
      request.input('Avatar_Url', sql.VarChar(2000), pr.Avatar_Url);
      request.input('User_Url', sql.VarChar(2000), pr.User_Url);
      try {
        let x = await request.execute('SavePR4Repo');
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
  }

  private shredObject(obj: any): PullRequest {
    let pr: PullRequest = new PullRequest();

    let action: string = _.get(obj.body, 'action');
    if (!action) {
      //if no action This may be a commit push
      action = _.get(obj.body, 'commits');
      action = 'commit';
    }
    action = action.toLowerCase();
    try {
      if (action === 'commit') {
        pr.Id = _.get(obj.body, 'repository.node_id');
        pr.Org = _.get(obj.body, 'repository.owner.login');
        pr.Repo = _.get(obj.body, 'repository.name');
        pr.Url = _.get(obj.body, 'commits[0].url');
        pr.Login = _.get(obj.body, 'commits[0].author.username');
        pr.Title = _.get(obj.body, 'commits[0].message');
        pr.State =  action;  
        pr.Avatar_Url = _.get(obj.body, 'sender.avatar_url');
        pr.User_Url = _.get(obj.body, 'sender.url');
        pr.Created_At = _.get(obj.body, 'commits[0].timestamp');
        pr.Body = " ";
      } else {
        pr.Id = _.get(obj.body, 'pull_request.node_id');
        pr.Org = _.get(obj.body, 'pull_request.base.repo.owner.login');
        pr.Repo = _.get(obj.body, 'pull_request.base.repo.name');
        pr.Url = _.get(obj.body, 'pull_request.url');
        pr.Login = _.get(obj.body, 'pull_request.user.login');
        pr.Title = _.get(obj.body, 'pull_request.title');
        pr.State =  action;  
        pr.Avatar_Url = _.get(obj.body, 'pull_request.user.avatar_url');
        pr.User_Url = _.get(obj.body, 'pull_request.user.url');
        pr.Created_At = _.get(obj.body, 'pull_request.created_at');
        pr.Body = _.get(obj.body, 'pull_request.body');
      }
     
    } catch (err) {
      console.log(err);
    }

    return pr;
  }

  async setItem(obj: any) {
    try {
      const first = await this.savePullRequestDetail(obj);
      return {first};
    } catch (err) {
      console.log(err);
    }
  }
}

export {SQLRepository};
