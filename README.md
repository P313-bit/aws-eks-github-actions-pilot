# AWS EKS GitHub Actions CI/CD Pilot

An end-to-end DevOps learning project demonstrating containerization,
AWS infrastructure, Kubernetes deployment, and CI automation.

## 1. Project Overview

This project deploys a Node.js REST API to Amazon EKS.

The current implementation includes:
- Docker containerization
- Amazon ECR image repository
- GitHub Actions CI pipeline
- AWS IAM OIDC authentication
- Amazon EKS managed node group
- Kubernetes Deployment and ClusterIP Service
- Application health and readiness probes

## 2. Architecture

### Current implementation

```text
Developer
   |
   v
GitHub Repository
   |
   v
GitHub Actions
   |
   | AWS OIDC authentication
   v
AWS IAM Role
   |
   v
Docker Build
   |
   v
Amazon ECR
   |
   | Manual kubectl image update (current stage)
   v
Amazon EKS
   |
   v
Kubernetes Deployment
   |
   v
Node.js API Pods (2 replicas)
   |
   v
Kubernetes ClusterIP Service
```

### Architecture transition

GitHub Actions will automatically deploy the new image to EKS.
Argo CD is installed and has successfully adopted and synchronized the existing Kubernetes Deployment and Service. GitHub Actions migration to GitOps-based image updates is still pending.

## 3. Technology Stack

| Category | Technology |
|---|---|
| Cloud | AWS |
| Containerization | Docker |
| Container Registry | Amazon ECR |
| Orchestration | Kubernetes |
| Managed Kubernetes | Amazon EKS |
| CI/CD | GitHub Actions |
| Authentication | AWS IAM OIDC |
| Infrastructure CLI | AWS CLI, eksctl |
| Application | Node.js, Express |
| Operating System | Ubuntu 24.04 |

## 4. AWS Environment

| Resource | Configuration |
|---|---|
| Region | ap-south-1 (Mumbai) |
| EKS Cluster | devops-pilot-eks |
| Kubernetes Version | 1.37 |
| Namespace | dev |
| Worker Nodes | 2 |
| Instance Type | t3.medium |
| Worker Node Group | Managed |
| ECR Repository | eks-pilot-api |
| ECR Image Scanning | Scan on push |
| ECR Tag Mutability | Immutable |

The cluster uses a dedicated VPC, public and private subnets,
and a NAT Gateway. Worker nodes are in private subnets.

## 5. Application Details

The project contains a Node.js REST API.

| Endpoint | Purpose |
|---|---|
| / | Application information |
| /health | Health check |
| /ready | Readiness check |

Application port: 3000

## 6. Kubernetes Configuration

Namespace: dev

Deployment: eks-pilot-api

Service: eks-pilot-api

Service type: ClusterIP

Replicas: 2

Container port: 3000

The Deployment includes:
- Startup probe
- Readiness probe
- Liveness probe
- CPU and memory requests
- CPU and memory limits

Both replicas were verified Running and Ready on separate worker nodes.

## 7. GitHub Actions CI/CD Pipeline

Workflow file:

`.github/workflows/build-and-push.yml`

The workflow contains two separate jobs:

**Job 1 — Build and Push Docker Image**

Runs on a GitHub-hosted Ubuntu runner.

1. Checkout source code.
2. Authenticate to AWS using GitHub OIDC.
3. Log in to Amazon ECR.
4. Configure Docker Buildx.
5. Build the Docker image.
6. Push the versioned image to Amazon ECR.

**Job 2 — Deploy Application to Amazon EKS**

Runs on the EC2 self-hosted GitHub Actions runner and depends on the successful completion of the build job.

1. Authenticate using the dedicated EKS deployment OIDC role.
2. Verify the AWS identity.
3. Configure the EKS kubeconfig.
4. Update the Kubernetes Deployment image.
5. Wait for the Kubernetes rolling update to complete.
6. Display Deployment and Pod status.

Image tags use the Git commit SHA and GitHub run attempt.

No permanent AWS access keys are stored in GitHub Actions.

### IAM roles

| IAM role | Purpose |
|---|---|
| `GitHubActionsECRPushRole` | Authenticate with Amazon ECR and push application images |
| `GitHubActionsEKSDeployRole` | Describe the EKS cluster and authenticate for Kubernetes deployment |

Both roles use GitHub OIDC authentication and are restricted to the trusted repository and `main` branch.

The EKS deployment role is registered through an EKS access entry and uses namespace-scoped Kubernetes RBAC rather than cluster-admin permissions.

## 8. Current Deployment Verification

The automated GitHub Actions deployment to Amazon EKS has been successfully tested.

Verified results:

- GitHub Actions successfully built and pushed the Docker image to Amazon ECR.
- GitHub OIDC authentication successfully assumed the EKS deployment IAM role.
- The self-hosted runner successfully configured access to the EKS cluster.
- Kubernetes Deployment image was updated automatically.
- Kubernetes rolling update completed successfully.
- Both application replicas are Running and Ready.
- Both replicas are scheduled across separate worker nodes.
- Deployment rollout verification succeeded.
- Application health endpoint returned `{"status":"healthy"}`.

Latest verified image:

`8174cf6207171d205e9ccc2fefcd07f6896d0ce9-1`

ECR image:

`750281913869.dkr.ecr.ap-south-1.amazonaws.com/eks-pilot-api`

The application health check was performed through the Kubernetes Service from a temporary test Pod. The temporary Pod was removed after verification.


## Argo CD GitOps — Verified Milestone

Argo CD v3.6.2 is installed in the `argocd` namespace.

Application: `eks-pilot-api-dev`

Configuration:
- Source repository: `P313-bit/aws-eks-github-actions-pilot`
- Branch: `main`
- Manifest path: `gitops/dev/eks-pilot-api`
- Destination namespace: `dev`
- Manifest type: Kustomize
- Sync policy: Manual

Repository files:
- `argocd/application.yaml`
- `gitops/dev/eks-pilot-api/api-deployment.yaml`
- `gitops/dev/eks-pilot-api/api-service.yaml`
- `gitops/dev/eks-pilot-api/kustomization.yaml`

Verification results:
- Argo CD sync operation: Succeeded
- Application sync status: Synced
- Application health: Healthy
- Service: Synced and Healthy
- Deployment: Synced and Healthy
- Application replicas: 2/2 Ready
- Both Pods: Running with zero restarts

The initial sync adopted the existing Kubernetes resources by adding
Argo CD tracking annotations. No application rollout was required.

Important: GitHub Actions still uses direct `kubectl set image`
deployment. The next milestone is to update the Kustomize image tag
through GitHub Actions and let Argo CD reconcile the deployment.
Automated sync, self-healing, and pruning are not enabled.

## 9. Repository Structure

```text
aws-eks-github-actions-pilot/
├── .github/
│   └── workflows/
│       └── build-and-push.yml
├── app/
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── k8s/
│   ├── api-deployment.yaml
│   ├── api-service.yaml
│   └── rbac-deployer.yaml
├── .gitignore
└── README.md
```

IAM policy files used for AWS configuration are kept locally
and are not part of the application repository.

## 10. Project Progress

| Milestone | Status |
|---|---|
| GitHub repository setup | Completed |
| Node.js API development | Completed |
| Docker image build | Completed |
| Amazon ECR repository | Completed |
| GitHub Actions CI workflow | Completed |
| GitHub OIDC authentication | Completed |
| EKS cluster provisioning | Completed |
| Kubernetes Deployment | Completed |
| Kubernetes Service | Completed |
| Application endpoint testing | Completed |
| Self-hosted GitHub Actions runner | Completed |
| Dedicated EKS deployment IAM role | Completed |
| EKS access entry | Completed |
| Namespace-scoped Kubernetes RBAC | Completed |
| Automated GitHub Actions EKS deployment | Completed and verified |
| Kubernetes rolling update verification | Completed |
| Application health check | Passed |
| Argo CD v3.6.2 installation | Completed |
| Argo CD Application and Kustomize manifests | Completed |
| Argo CD manual sync and resource adoption | Completed and verified |
| GitHub Actions GitOps image update | Pending |
| Monitoring and observability | Planned |
| Final architecture documentation | In progress |

## 11. Next Implementation Steps

1. Migrate GitHub Actions from direct kubectl image updates to GitOps manifest updates.
2. Evaluate production-inspired Kubernetes resilience and security improvements.
3. Add monitoring and observability.
4. Improve deployment reporting and troubleshooting documentation.
5. Document the final architecture and operational procedures.

## 12. Cost and Cleanup Considerations

This learning environment uses billable AWS resources, including:

- Amazon EKS cluster
- EC2 worker nodes
- NAT Gateway and data processing
- EBS volumes
- Amazon ECR storage and data transfer

Review AWS costs regularly. When the project is not in use,
stop or delete resources safely according to the cleanup plan.

## 13. Repository

GitHub:

https://github.com/P313-bit/aws-eks-github-actions-pilot

---

Project status: GitHub Actions CI/CD pipeline and automated EKS deployment verified.
Next milestone: GitHub Actions GitOps image updates and Argo CD deployment validation.

## Self-Hosted GitHub Actions Runner

A self-hosted GitHub Actions runner has been registered on the existing Ubuntu EC2 instance to support deployment to the EKS cluster.

### Runner Configuration

| Setting | Value |
|---|---|
| Runner name | `eks-deployment-runner` |
| Runner group | `Default` |
| Platform | Linux x64 |
| Labels | `self-hosted`, `Linux`, `X64`, `eks-deploy` |
| Linux service account | `github-runner` |
| Installation directory | `/opt/actions-runner` |
| Work directory | `_work` |
| Runner version | `2.338.2` |
| Service manager | systemd |
| Current status | Connected and successfully executed deployment jobs |

### Runner Security

- The runner operates under a dedicated Linux account named `github-runner`.
- The account is not a member of the `sudo` or `docker` groups.
- The runner is installed as a systemd service and starts automatically.
- The runner account has no EC2 instance profile credentials.
- AWS credentials are provided to deployment jobs through GitHub OIDC.
- A dedicated GitHub OIDC deployment IAM role and restricted EKS permissions are configured and verified.
- The EKS public API endpoint remains restricted to the configured EC2 public IP.

### Deployment Status

The self-hosted runner is connected to GitHub and has successfully executed the EKS deployment job. It uses GitHub OIDC to obtain temporary AWS credentials. The deployment workflow updates the application image and verifies the Kubernetes rollout.

### Network Connectivity Verification

| Check | Verified value |
|---|---|
| Self-hosted runner EC2 region | `us-east-2` |
| EKS cluster region | `ap-south-1` |
| EC2 outbound public IP | `18.118.253.128` |
| EKS public API allowed CIDR | `18.118.253.128/32` |
| Network allowlist match | Confirmed |

The EC2 runner's outbound public IP matches the EKS API allowlist. The EKS public endpoint remains restricted rather than being opened to all internet addresses.

The EC2 instance metadata endpoint did not return IAM instance profile information. The runner account also returned `NoCredentials` when checking its AWS CLI identity. The dedicated GitHub OIDC deployment role has been created, registered with the EKS cluster, and successfully used by the automated deployment workflow.

### GitHub OIDC EKS Deployment Access

A dedicated IAM role was created for GitHub Actions EKS deployments.

| Component | Configuration |
|---|---|
| IAM role | `GitHubActionsEKSDeployRole` |
| IAM policy | `GitHubActionsEKSDeployPolicy` |
| AWS permission | `eks:DescribeCluster` |
| EKS cluster | `devops-pilot-eks` |
| EKS region | `ap-south-1` |
| Authentication | GitHub Actions OIDC |
| Trusted repository | `P313-bit/aws-eks-github-actions-pilot` |
| Trusted branch | `main` |

The role is registered with the EKS cluster through an EKS access entry and belongs to the Kubernetes group `github-actions-deployer`.

### Namespace-Scoped Kubernetes RBAC

The manifest `k8s/rbac-deployer.yaml` creates a Role and RoleBinding in the `dev` namespace.

| Resource | Permissions |
|---|---|
| Deployments | get, list, watch, patch |
| ReplicaSets | get, list, watch |
| Pods | get, list, watch |
| Services | get, list, watch |
| Secrets | No access |

Authorization checks using Kubernetes impersonation returned:

| Check | Result |
|---|---|
| Patch deployments | Allowed |
| Read pods | Allowed |
| Read secrets | Denied |

The deployment role does not receive cluster-admin access or namespace-wide administrative permissions.
