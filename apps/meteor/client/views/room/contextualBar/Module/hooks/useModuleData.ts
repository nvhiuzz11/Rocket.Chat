import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

export const useModuleData = (moduleId: string) => {
	const getModule = useEndpoint('GET', '/v1/modules.info');
	const getStages = useEndpoint('GET', '/v1/stages.listByModuleId');
	const getDocuments = useEndpoint('GET', '/v1/documents.listByModuleId');

	const moduleQuery = useQuery({
		queryKey: ['module', moduleId],
		queryFn: () => getModule({ moduleId }),
		enabled: !!moduleId,
	});

	const stagesQuery = useQuery({
		queryKey: ['stages', moduleId],
		queryFn: () => getStages({ moduleId }),
		enabled: !!moduleId,
	});

	const documentsQuery = useQuery({
		queryKey: ['documents', moduleId],
		queryFn: () => getDocuments({ moduleId }),
		enabled: !!moduleId,
	});

	return {
		module: moduleQuery.data?.module,
		stages: stagesQuery.data?.stages || [],
		documents: documentsQuery.data?.documents || [],
		isLoading: moduleQuery.isLoading || stagesQuery.isLoading || documentsQuery.isLoading,
		error: moduleQuery.error || stagesQuery.error || documentsQuery.error,
		refetch: () => {
			moduleQuery.refetch();
			stagesQuery.refetch();
			documentsQuery.refetch();
		},
	};
};