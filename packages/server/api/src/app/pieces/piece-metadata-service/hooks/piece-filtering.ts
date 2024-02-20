import { PieceCategory, assertNotNullOrUndefined } from '@activepieces/shared'
import { PieceMetadataSchema } from '../../piece-metadata-entity'
import Fuse from 'fuse.js'
import { ActionBase, TriggerBase } from '@activepieces/pieces-framework'


const pieceFilterKeys = ['displayName', 'description']
const suggestionLimit = 3
export const filterPiecesBasedUser = ({
    searchQuery,
    pieces,
    categories,
    includeActionsAndTriggers,
}: {
    categories: PieceCategory[] | undefined
    searchQuery: string | undefined
    pieces: PieceMetadataSchema[]
    includeActionsAndTriggers?: boolean
}): PieceMetadataSchema[] => {
    return filterBasedOnCategories({
        categories,
        pieces: filterBasedOnSearchQuery({ searchQuery, pieces, includeActionsAndTriggers }),
    })
}

const filterBasedOnSearchQuery = ({
    searchQuery,
    pieces,
    includeActionsAndTriggers,
}: {
    searchQuery: string | undefined
    pieces: PieceMetadataSchema[]
    includeActionsAndTriggers?: boolean
}): PieceMetadataSchema[] => {
    if (!searchQuery) {
        return pieces
    }
    if (includeActionsAndTriggers) {
        return searchWithinActionsAndTriggersAsWell(searchQuery, pieces)
    }
    const fuse = new Fuse(pieces, {
        isCaseSensitive: false,
        shouldSort: true,
        keys:
            pieceFilterKeys,
        threshold: 0.3,
    })

    return fuse
        .search(searchQuery)
        .map(({ item }) => item)
}

const filterBasedOnCategories = ({
    categories,
    pieces,
}: {
    categories: PieceCategory[] | undefined
    pieces: PieceMetadataSchema[]
}): PieceMetadataSchema[] => {
    if (!categories) {
        return pieces
    }

    return pieces.filter((p) => {
        return categories.some((item) => (p.categories ?? []).includes(item))
    })
}


const searchWithinActionsAndTriggersAsWell = (searchQuery: string, pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    const putActionsAndTriggersInAnArray = pieces.map((piece) => {
        const actions = Object.keys(piece.actions).map((name) => piece.actions[name])
        const triggers = Object.keys(piece.triggers).map((name) => piece.triggers[name])

        return {
            ...piece,
            actions,
            triggers,
        }
    })

    const pieceWithTriggersAndActionsFilterKeys = [
        ...pieceFilterKeys,
        'actions.displayName',
        'actions.description',
        'triggers.displayName',
        'triggers.description',
    ]
    const fuse = new Fuse(putActionsAndTriggersInAnArray, {
        isCaseSensitive: false,
        shouldSort: true,
        keys: pieceWithTriggersAndActionsFilterKeys,
        threshold: 0.2,
    })

    return fuse
        .search(searchQuery)
        .map(({ item }) => {
            const originalPiece = pieces.find((p) => p.id === item.id)
            assertNotNullOrUndefined(originalPiece, 'Piece not found')
            const suggestedActions = searchForSuggestion(item.actions, searchQuery)
            const suggestedTriggers = searchForSuggestion(item.triggers, searchQuery)
            return {
                ...originalPiece,
                actions: suggestedActions,
                triggers: suggestedTriggers,
            }

        })

}
function searchForSuggestion<T extends ActionBase | TriggerBase>(actions: T[], searchQuery: string): Record<string, T> {
    const nestedFuse = new Fuse(actions, {
        isCaseSensitive: false,
        shouldSort: true,
        keys: ['displayName', 'description'],
        threshold: 0.2,
    })
    const suggestions = nestedFuse.search(searchQuery, { limit: suggestionLimit }).map(({ item }) => item)
    return suggestions.reduce<Record<string, T>>((filteredSuggestions, suggestion) => {
        filteredSuggestions[suggestion.name] = suggestion
        return filteredSuggestions
    }, {})
}

