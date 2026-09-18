-- Drop legacy single github_url; repos live in project_repos
ALTER TABLE projects DROP COLUMN github_url;
