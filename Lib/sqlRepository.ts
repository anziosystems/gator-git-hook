let sql = require('mssql');
import * as _ from 'lodash';
const dotenv = require('dotenv');
dotenv.config();

class PullRequest {
  Id: string;
  Org: string;
  Repo: string;
  Url: string;
  State: string;
  Action: string;
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
  sqlConfigSetting: any = {};
  
  constructor() {
    this.createPool();
  }

  async createPool() {
    if (!this.pool) {
      this.sqlConfigSetting.server = process.env.SQL_Server;
      this.sqlConfigSetting.database = process.env.SQL_Database;
      this.sqlConfigSetting.user = process.env.SQL_User;
      this.sqlConfigSetting.password = process.env.SQL_Password;
      this.sqlConfigSetting.port = 1433;
      this.sqlConfigSetting.encrypt = true;
      await new sql.ConnectionPool(this.sqlConfigSetting).connect().then((pool: any) => {
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
      request.input('Org', sql.VarChar(200), pr.Org);
      request.input('Repo', sql.VarChar(200), pr.Repo);
      request.input('Url', sql.VarChar(2000), pr.Url);
      request.input('State', sql.VarChar(50), pr.State);
      request.input('Action', sql.VarChar(50), pr.Action);
      request.input('Title', sql.VarChar(2000), pr.Title);
      request.input('Created_At', sql.VarChar(20), pr.Created_At.substr(0, 19));
      request.input('Body', sql.VarChar(2000), pr.Body);
      request.input('Login', sql.VarChar(100), pr.Login);
      request.input('Avatar_Url', sql.VarChar(2000), pr.Avatar_Url);
      request.input('User_Url', sql.VarChar(2000), pr.User_Url);
      let x = await request.execute('SavePR4Repo');
      if (x) {
        if (x.rowsAffected) {
          return 'rows Affected' + x.rowsAffected[0];
        }
      }
      return 'None';
    } catch (err) {
      if (err.number === 2601) {
        console.log('savePullRequestDetail: ' + err); //Duplicate Record
      } else {
        throw err;
      }
    }
  }

  private shredObject(obj: any): PullRequest {
    let pr: PullRequest = new PullRequest();

    let state: string = _.get(obj, 'pull_request.state');
    let action: string = _.get(obj, 'action');
    if (!action) {
      //if no action This may be a commit push
      action = _.get(obj, 'commits');
      action = 'commit';
    }
    action = action.toLowerCase();
    if (!state)
        state = action ;

    if (action === 'commit') {
      pr.Id = _.get(obj, 'repository.node_id');
      pr.Org = _.get(obj, 'repository.owner.login'); //org name comes here
      pr.Repo = _.get(obj, 'repository.name');
      pr.Url = _.get(obj, 'head_commit.url');
      pr.Login = _.get(obj, 'head_commit.author.username');
      if (pr.Login == undefined) {
        pr.Login = _.get(obj, 'head_commit.author.name');
      }
      pr.Title = _.get(obj, 'head_commit.message');
      pr.State = state;
      pr.Action = action;
      pr.Avatar_Url = _.get(obj, 'sender.avatar_url');
      pr.User_Url = _.get(obj, 'sender.url');
      pr.Created_At = _.get(obj, 'head_commit.timestamp');
      pr.Body = ' ';
    } else {
      pr.Id = _.get(obj, 'pull_request.node_id');
      pr.Org = _.get(obj, 'pull_request.base.repo.owner.login');
      pr.Repo = _.get(obj, 'pull_request.base.repo.name');
      pr.Url = _.get(obj, 'pull_request.url');
      pr.Login = _.get(obj, 'pull_request.user.login');
      pr.Title = _.get(obj, 'pull_request.title');
      pr.State = state;
      pr.Action = action;
      pr.Avatar_Url = _.get(obj, 'pull_request.user.avatar_url');
      pr.User_Url = _.get(obj, 'pull_request.user.url');
      pr.Created_At = _.get(obj, 'pull_request.created_at');
      pr.Body = _.get(obj, 'pull_request.body');
    }

  
    return pr;
  }
 
}

export {SQLRepository};
