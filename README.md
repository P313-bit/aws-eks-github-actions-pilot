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

### Planned architecture

GitHub Actions will automatically deploy the new image to EKS.
Argo CD GitOps will be introduced as a later milestone.

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

## 7. GitHub Actions CI Pipeline

Workflow file:

.github/workflows/build-and-push.yml

Current pipeline steps:

1. Checkout source code.
2. Authenticate to AWS using GitHub OIDC.
3. Log in to Amazon ECR.
4. Configure Docker Buildx.
5. Build the Docker image.
6. Push the image to Amazon ECR.

Image tags use the Git commit SHA and GitHub run attempt.

No permanent AWS access keys are stored in GitHub Actions.

### IAM roles

Existing CI role:

GitHubActionsECRPushRole

Purpose:
- Authenticate with Amazon ECR.
- Push images to the eks-pilot-api repository.

This role is separate from the planned EKS deployment role.

## 8. Current Deployment Verification

The following checks have passed:

- GitHub Actions successfully built and pushed a Docker image.
- The CI image is available in Amazon ECR.
- Kubernetes Deployment successfully rolled out the CI image.
- Both application replicas are Running and Ready.
- Both replicas are scheduled on separate worker nodes.
- Application root endpoint returned the expected JSON response.
- Health endpoint returned healthy status.
- Kubernetes server-side manifest validation passed.

Current verified CI image:

20516bb5e0a37cfa502ad775163be8f0447953d6-3

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
│   └── api-service.yaml
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
| AWS OIDC authentication | Completed |
| EKS cluster provisioning | Completed |
| Kubernetes Deployment | Completed |
| Kubernetes Service | Completed |
| Application endpoint testing | Completed |
| CI image deployment to EKS | Completed (manual update) |
| README documentation | Completed |
| Automated GitHub Actions to EKS deployment | Planned |
| Argo CD GitOps integration | Planned |
| Monitoring and observability | Planned |
| Final architecture documentation | Planned |

## 11. Next Implementation Steps

1. Create a dedicated IAM role for EKS deployment.
2. Configure GitHub OIDC trust for the deployment role.
3. Configure restricted EKS access for that role.
4. Update GitHub Actions to deploy the image automatically.
5. Test the complete CI/CD workflow.
6. Introduce Argo CD for GitOps-based deployment.
7. Add monitoring and observability.
8. Document final architecture and troubleshooting.

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

Project status: CI pipeline and EKS deployment verified.
Next milestone: Automated GitHub Actions deployment to EKS.

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
| Current status | Idle |

### Runner Security

- The runner operates under a dedicated Linux account named `github-runner`.
- The account is not a member of the `sudo` or `docker` groups.
- The runner is installed as a systemd service and starts automatically.
- An AWS CLI identity check under the runner account returned `NoCredentials`.
- EC2 instance profile and metadata access verification is still pending.
- A dedicated GitHub OIDC deployment IAM role and restricted EKS permissions are planned.
- The EKS public API endpoint remains restricted to the configured EC2 public IP.

### Deployment Status

The self-hosted runner is connected to GitHub and ready to accept jobs. Automated EKS deployment is not yet configured.

Next steps:
1. Verify the EC2 instance identity and instance profile.
2. Create a dedicated GitHub OIDC deployment IAM role.
3. Configure an EKS access entry and namespace-scoped Kubernetes RBAC.
4. Add the deployment job to the GitHub Actions workflow.
5. Verify automated image deployment and Kubernetes rollout.

### Network Connectivity Verification

| Check | Verified value |
|---|---|
| Self-hosted runner EC2 region | `us-east-2` |
| EKS cluster region | `ap-south-1` |
| EC2 outbound public IP | `18.118.253.128` |
| EKS public API allowed CIDR | `18.118.253.128/32` |
| Network allowlist match | Confirmed |

The EC2 runner's outbound public IP matches the EKS API allowlist. The EKS public endpoint remains restricted rather than being opened to all internet addresses.

The EC2 instance metadata endpoint did not return IAM instance profile information. The runner account also returned `NoCredentials` when checking its AWS CLI identity. A dedicated GitHub OIDC deployment role is planned.
